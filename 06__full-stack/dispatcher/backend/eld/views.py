from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from trips.models import Trip
from hos.models import TripSchedule
from hos.services.schedule_engine import ScheduleEngine
from .models import DailyLog
from .serializers import DailyLogSerializer, ELDGenerateSerializer
from .services.log_generator import ELDLogGenerator
from .services.pdf_export import ELDPDFExporter


class ELDGenerateView(APIView):
    """
    POST /api/eld/generate
    Generates multi-day FMCSA daily ELD log sheets for a given trip or raw schedule input.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ELDGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        trip_id = data.get("trip_id")
        driver_info = {
            "name": data.get("driver_name", "John Doe"),
            "carrier": data.get("carrier", "Apex Logistics Inc."),
            "vehicle_number": data.get("vehicle_number", "Truck #402"),
            "trailer_number": data.get("trailer_number", "TR-881"),
        }

        log_gen = ELDLogGenerator()

        if trip_id:
            try:
                trip = Trip.objects.get(id=trip_id)
            except Trip.DoesNotExist:
                return Response(
                    {"error": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
                )

            # Check if TripSchedule exists
            schedules = TripSchedule.objects.filter(trip=trip).order_by("order")

            if schedules.exists():
                events = [
                    {
                        "type": s.event_type,
                        "start_time": s.start_time.isoformat() if s.start_time else "",
                        "end_time": s.end_time.isoformat() if s.end_time else "",
                        "duration": s.duration,
                        "distance": s.distance,
                        "location": s.location,
                        "notes": s.notes,
                    }
                    for s in schedules
                ]
            else:
                dist = round((trip.distance_meters or 0) / 1609.34, 1) or 500.0
                dur = round((trip.duration_seconds or 0) / 3600.0, 1) or 10.0
                cyc = float(trip.current_cycle_used or 0.0)

                engine = ScheduleEngine()
                sched_res = engine.generate_schedule(
                    distance=dist,
                    duration=dur,
                    cycle_used=cyc,
                    start_datetime=data.get("start_time"),
                    origin_name=trip.current_location_name or trip.current_location,
                    pickup_name=trip.pickup_name or trip.pickup_location,
                    dropoff_name=trip.dropoff_name or trip.dropoff_location,
                )
                events = sched_res["events"]

            daily_logs_data = log_gen.generate_daily_logs(
                events=events,
                trip=trip,
                driver_info=driver_info,
                initial_cycle_used=float(trip.current_cycle_used or 0.0),
                persist=True,
            )

            queryset = DailyLog.objects.filter(trip=trip)
            return Response(
                {
                    "trip_id": str(trip.id),
                    "total_days": len(daily_logs_data),
                    "logs": DailyLogSerializer(queryset, many=True).data,
                },
                status=status.HTTP_200_OK,
            )

        else:
            # Standalone generation
            dist = data.get("distance", 1842.0)
            dur = data.get("duration", 27.4)
            cyc = data.get("cycle_used", 25.0)

            engine = ScheduleEngine()
            sched_res = engine.generate_schedule(
                distance=dist,
                duration=dur,
                cycle_used=cyc,
                start_datetime=data.get("start_time"),
            )

            daily_logs_data = log_gen.generate_daily_logs(
                events=sched_res["events"],
                driver_info=driver_info,
                trip_info={
                    "origin": "Origin",
                    "pickup": "Pickup Location",
                    "dropoff": "Destination",
                    "distance": dist,
                    "duration": dur,
                },
                initial_cycle_used=cyc,
                persist=False,
            )

            return Response(
                {
                    "trip_id": None,
                    "total_days": len(daily_logs_data),
                    "logs": daily_logs_data,
                },
                status=status.HTTP_200_OK,
            )


class ELDDetailView(APIView):
    """
    GET /api/eld/{tripId}
    Retrieves all ELD daily log sheets for a given trip.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, trip_id):
        try:
            trip = Trip.objects.get(id=trip_id)
        except Trip.DoesNotExist:
            return Response(
                {"error": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
            )

        queryset = DailyLog.objects.filter(trip=trip)
        if not queryset.exists():
            # Auto-generate if not present
            dist = round((trip.distance_meters or 0) / 1609.34, 1) or 500.0
            dur = round((trip.duration_seconds or 0) / 3600.0, 1) or 10.0
            cyc = float(trip.current_cycle_used or 0.0)

            engine = ScheduleEngine()
            sched_res = engine.generate_schedule(
                distance=dist,
                duration=dur,
                cycle_used=cyc,
                origin_name=trip.current_location_name or trip.current_location,
                pickup_name=trip.pickup_name or trip.pickup_location,
                dropoff_name=trip.dropoff_name or trip.dropoff_location,
            )
            log_gen = ELDLogGenerator()
            log_gen.generate_daily_logs(
                events=sched_res["events"],
                trip=trip,
                initial_cycle_used=cyc,
                persist=True,
            )
            queryset = DailyLog.objects.filter(trip=trip)

        return Response(
            {
                "trip_id": str(trip.id),
                "total_days": queryset.count(),
                "logs": DailyLogSerializer(queryset, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class ELDPDFExportView(APIView):
    """
    GET /api/eld/{tripId}/pdf
    Generates and downloads printable FMCSA PDF log sheets.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, trip_id):
        daily_logs_data = []

        if (
            str(trip_id).lower() == "sample"
            or str(trip_id) == "00000000-0000-0000-0000-000000000000"
        ):
            # Assessment sample scenario export
            engine = ScheduleEngine()
            sched_res = engine.generate_schedule(
                distance=1842.0, duration=27.4, cycle_used=25.0
            )
            log_gen = ELDLogGenerator()
            daily_logs_data = log_gen.generate_daily_logs(
                events=sched_res["events"],
                trip_info={
                    "origin": "New York, NY",
                    "pickup": "Chicago, IL",
                    "dropoff": "Los Angeles, CA",
                    "distance": 1842.0,
                    "duration": 27.4,
                },
                initial_cycle_used=25.0,
                persist=False,
            )
        else:
            try:
                trip = Trip.objects.get(id=trip_id)
            except Trip.DoesNotExist:
                return Response(
                    {"error": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
                )

            queryset = DailyLog.objects.filter(trip=trip)
            if not queryset.exists():
                dist = round((trip.distance_meters or 0) / 1609.34, 1) or 500.0
                dur = round((trip.duration_seconds or 0) / 3600.0, 1) or 10.0
                cyc = float(trip.current_cycle_used or 0.0)

                engine = ScheduleEngine()
                sched_res = engine.generate_schedule(
                    distance=dist,
                    duration=dur,
                    cycle_used=cyc,
                    origin_name=trip.current_location_name or trip.current_location,
                    pickup_name=trip.pickup_name or trip.pickup_location,
                    dropoff_name=trip.dropoff_name or trip.dropoff_location,
                )
                log_gen = ELDLogGenerator()
                daily_logs_data = log_gen.generate_daily_logs(
                    events=sched_res["events"],
                    trip=trip,
                    initial_cycle_used=cyc,
                    persist=True,
                )
            else:
                daily_logs_data = DailyLogSerializer(queryset, many=True).data

        exporter = ELDPDFExporter()
        pdf_bytes = exporter.export_pdf(daily_logs_data)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="fmcsa_daily_logs_{trip_id}.pdf"'
        )
        return response
