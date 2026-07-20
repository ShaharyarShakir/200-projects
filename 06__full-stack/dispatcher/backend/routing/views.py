from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from trips.models import Trip
from .serializers import (
    GeocodeRequestSerializer,
    RouteRequestSerializer,
    LocationSearchQuerySerializer,
    LocationReverseQuerySerializer,
)
from .services.ors import ORSService
from .services.geocoding import GeocodingService

class LocationSearchView(APIView):
    def get(self, request):
        serializer = LocationSearchQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        q = serializer.validated_data["q"]
        results = GeocodingService.search(q)
        return Response(results, status=status.HTTP_200_OK)

class LocationReverseView(APIView):
    def get(self, request):
        serializer = LocationReverseQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        lat = serializer.validated_data["lat"]
        lng = serializer.validated_data["lng"]
        result = GeocodingService.reverse(lat, lng)
        return Response(result, status=status.HTTP_200_OK)


class GeocodeView(APIView):
    def post(self, request):
        serializer = GeocodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        address = serializer.validated_data["address"]
        try:
            coords = ORSService.geocode(address)
            return Response(coords, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to geocode address: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RouteView(APIView):
    def post(self, request):
        serializer = RouteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        origin = data["origin"]
        pickup = data["pickup"]
        dropoff = data["dropoff"]

        try:
            route_result = ORSService.calculate_route(origin, pickup, dropoff)
            return Response(route_result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Route calculation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RouteDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id, user=request.user)

        # Check if route is already calculated and cached on trip
        if trip.route_geometry and trip.route_summary and trip.distance_meters is not None:
            return Response({
                "trip_id": str(trip.id),
                "distance": trip.distance_meters,
                "duration": trip.duration_seconds,
                "geometry": trip.route_geometry,
                "summary": trip.route_summary,
                "cached": True
            }, status=status.HTTP_200_OK)

        # If coordinates exist, calculate and persist
        if (trip.current_lat is not None and trip.current_lng is not None and
            trip.pickup_lat is not None and trip.pickup_lng is not None and
            trip.dropoff_lat is not None and trip.dropoff_lng is not None):

            origin = [trip.current_lng, trip.current_lat]
            pickup = [trip.pickup_lng, trip.pickup_lat]
            dropoff = [trip.dropoff_lng, trip.dropoff_lat]

            try:
                route_result = ORSService.calculate_route(origin, pickup, dropoff)
                
                # Persist on Trip model
                trip.distance_meters = route_result.get("distance")
                trip.duration_seconds = route_result.get("duration")
                trip.route_geometry = route_result.get("geometry")
                trip.route_summary = route_result.get("summary")
                trip.save()

                route_result["trip_id"] = str(trip.id)
                route_result["cached"] = False
                return Response(route_result, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(
                    {"error": f"Failed to compute route for trip: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(
            {"error": "Trip coordinates are missing. Geocode locations before calculating route."},
            status=status.HTTP_400_BAD_REQUEST
        )
