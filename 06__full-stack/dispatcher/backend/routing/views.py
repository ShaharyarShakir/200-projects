from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import GeocodeRequestSerializer, RouteRequestSerializer
from .services.ors import ORSService

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
