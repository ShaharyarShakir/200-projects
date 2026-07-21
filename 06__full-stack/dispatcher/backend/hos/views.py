from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime

from trips.models import Trip
from .models import TripSchedule
from .serializers import HOSEngineInputSerializer, TripScheduleSerializer
from .services.schedule_engine import ScheduleEngine


class HOSGenerateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = HOSEngineInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        trip_id = data.get("trip_id")
        distance = data.get("distance")
        duration = data.get("duration")
        cycle_used = data.get("cycle_used", 0.0)
        start_time = data.get("start_time")

        trip = None
        if trip_id:
            trip = get_object_or_404(Trip, id=trip_id)
            if trip.distance_meters is None or trip.duration_seconds is None:
                return Response(
                    {
                        "error": "Trip route distance and duration are not calculated yet. Calculate route first."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            distance = trip.distance_meters / 1609.344  # convert meters to miles
            duration = trip.duration_seconds / 3600.0  # convert seconds to hours
            if "cycle_used" not in request.data:
                cycle_used = float(trip.current_cycle_used)

        try:
            engine = ScheduleEngine()
            result = engine.generate_schedule(
                distance=distance,
                duration=duration,
                cycle_used=cycle_used,
                start_datetime=start_time,
                origin_name=trip.current_location_name or trip.current_location
                if trip
                else "Origin",
                pickup_name=trip.pickup_name or trip.pickup_location
                if trip
                else "Pickup",
                dropoff_name=trip.dropoff_name or trip.dropoff_location
                if trip
                else "Destination",
            )

            # If associated with a DB Trip, persist TripSchedule records
            if trip:
                # Delete existing schedules for this trip
                TripSchedule.objects.filter(trip=trip).delete()

                schedule_objs = []
                for ev in result["events"]:
                    schedule_objs.append(
                        TripSchedule(
                            trip=trip,
                            order=ev["order"],
                            event_type=ev["type"],
                            start_time=parse_datetime(ev["start_time"]),
                            end_time=parse_datetime(ev["end_time"]),
                            duration=ev["hours"],
                            distance=ev["distance"],
                            location=ev["location"],
                            notes=ev["notes"],
                        )
                    )
                TripSchedule.objects.bulk_create(schedule_objs)

                # Update trip status if draft
                if trip.status == Trip.Status.DRAFT:
                    trip.status = Trip.Status.PLANNING
                    trip.save()

                result["trip_id"] = str(trip.id)

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Failed to generate HOS schedule: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TripScheduleView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)
        schedules = TripSchedule.objects.filter(trip=trip).order_by("order")
        serializer = TripScheduleSerializer(schedules, many=True)
        return Response(
            {"trip_id": str(trip.id), "events": serializer.data},
            status=status.HTTP_200_OK,
        )
