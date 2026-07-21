import logging
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from trips.models import Trip
from routing.services.ors import ORSService
from .models import Stop
from .serializers import (
    StopSerializer,
    OptimizeRequestSerializer,
    OptimizeResponseSerializer,
    AlternativeRouteSerializer,
)
from .services.optimizer import RouteOptimizer

logger = logging.getLogger(__name__)


class OptimizeView(APIView):
    """
    POST /api/optimization/optimize
    Trigger location-aware stop planning and route optimization.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = OptimizeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        trip_id = data.get("tripId")
        trip = None

        if trip_id:
            trip = get_object_or_404(Trip, id=trip_id)

        if trip:
            current_loc = trip.current_location
            pickup_loc = trip.pickup_location
            dropoff_loc = trip.dropoff_location
            cycle_used = float(trip.current_cycle_used)
            geometry = trip.route_geometry or []
            dist_m = trip.distance_meters or 0.0
            dur_s = trip.duration_seconds or 0.0
        else:
            current_loc = data.get("current_location") or "Dallas, TX"
            pickup_loc = data.get("pickup_location") or "Oklahoma City, OK"
            dropoff_loc = data.get("dropoff_location") or "Tulsa, OK"
            cycle_used = float(data.get("current_cycle_used", 0.0))
            geometry = []
            dist_m = 0.0
            dur_s = 0.0

        # Geocode and calculate route if geometry is missing
        if not geometry or dist_m <= 0:
            c_coords = ORSService.geocode(current_loc)
            p_coords = ORSService.geocode(pickup_loc)
            d_coords = ORSService.geocode(dropoff_loc)

            route_res = ORSService.calculate_route(
                [c_coords["lng"], c_coords["lat"]],
                [p_coords["lng"], p_coords["lat"]],
                [d_coords["lng"], d_coords["lat"]],
            )
            geometry = route_res.get("geometry", [])
            dist_m = route_res.get("distance", 100000.0)
            dur_s = route_res.get("duration", 7200.0)

            if trip:
                trip.route_geometry = geometry
                trip.distance_meters = dist_m
                trip.duration_seconds = dur_s
                trip.save()

        pickup_name = trip.pickup_name if trip else pickup_loc
        dropoff_name = trip.dropoff_name if trip else dropoff_loc
        start_time = data.get("start_time")
        driver_prefs = data.get("driver_preferences", {})

        result = RouteOptimizer.optimize_route(
            geometry=geometry,
            distance_meters=dist_m,
            duration_seconds=dur_s,
            cycle_used=cycle_used,
            start_datetime=start_time,
            pickup_name=pickup_name,
            dropoff_name=dropoff_name,
            driver_preferences=driver_prefs,
        )

        # Save stops to DB if trip exists
        if trip:
            # Delete non-locked existing stops for this trip
            Stop.objects.filter(trip=trip, is_locked=False).delete()
            for stop_dict in result["optimized_stops"]:
                Stop.objects.create(
                    trip=trip,
                    name=stop_dict["name"],
                    category=stop_dict["category"],
                    latitude=stop_dict["latitude"],
                    longitude=stop_dict["longitude"],
                    distance_from_start=stop_dict["distance_from_start"],
                    arrival_time=stop_dict.get("arrival_time"),
                    departure_time=stop_dict.get("departure_time"),
                    duration=stop_dict.get("duration", 0.5),
                    priority=stop_dict.get("priority", 80.0),
                    source=stop_dict.get("source", "OpenRouteService POI"),
                    is_locked=stop_dict.get("is_locked", False),
                    is_custom=stop_dict.get("is_custom", False),
                    order=stop_dict.get("order", 0),
                    metadata=stop_dict.get("metadata", {}),
                )

        response_serializer = OptimizeResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class AlternativeRoutesView(APIView):
    """
    GET /api/optimization/alternatives/{tripId}
    Fetch alternative route options for a trip.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, tripId, *args, **kwargs):
        trip = get_object_or_404(Trip, id=tripId)
        dist_m = trip.distance_meters or 500000.0
        dur_s = trip.duration_seconds or 25000.0
        dist_miles = round(dist_m / 1609.34, 1)
        dur_hours = round(dur_s / 3600.0, 1)

        fuel_stops = max(1, int(dist_miles // 800.0))
        fuel_price = 3.85
        gallons = dist_miles / 6.5
        est_cost = round(gallons * fuel_price, 2)

        alternatives = [
            {
                "id": "fastest",
                "name": "Fastest Express Corridor",
                "tag": "Shortest Time",
                "distance_miles": dist_miles,
                "time_hours": dur_hours,
                "fuel_stops": fuel_stops,
                "estimated_cost": est_cost,
                "score_percent": 96,
            },
            {
                "id": "eco-fuel",
                "name": "Fuel-Efficient Network",
                "tag": "Lowest Fuel Cost",
                "distance_miles": round(dist_miles * 1.02, 1),
                "time_hours": round(dur_hours + 0.4, 1),
                "fuel_stops": fuel_stops,
                "estimated_cost": round(est_cost * 0.93, 2),
                "score_percent": 94,
            },
            {
                "id": "preferred-chains",
                "name": "Preferred Stop Network",
                "tag": "Pilot & Love's",
                "distance_miles": round(dist_miles * 1.01, 1),
                "time_hours": round(dur_hours + 0.2, 1),
                "fuel_stops": fuel_stops,
                "estimated_cost": round(est_cost * 0.97, 2),
                "score_percent": 91,
            },
        ]

        serializer = AlternativeRouteSerializer(alternatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StopViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Stop models (CRUD, lock, reorder, custom stops).
    """

    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Stop.objects.all()
        trip_id = self.request.query_params.get("tripId")
        if trip_id:
            queryset = queryset.filter(trip_id=trip_id)
        return queryset
