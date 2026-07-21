from rest_framework import serializers
from .models import Stop


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = [
            "id",
            "trip",
            "name",
            "category",
            "latitude",
            "longitude",
            "distance_from_start",
            "arrival_time",
            "departure_time",
            "duration",
            "priority",
            "source",
            "is_locked",
            "is_custom",
            "order",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class OptimizeRequestSerializer(serializers.Serializer):
    tripId = serializers.UUIDField(required=False, allow_null=True)
    current_location = serializers.CharField(required=False, allow_blank=True)
    pickup_location = serializers.CharField(required=False, allow_blank=True)
    dropoff_location = serializers.CharField(required=False, allow_blank=True)
    current_cycle_used = serializers.FloatField(required=False, default=0.0)
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    driver_preferences = serializers.DictField(required=False, default=dict)


class AlternativeRouteSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    tag = serializers.CharField()
    distance_miles = serializers.FloatField()
    time_hours = serializers.FloatField()
    fuel_stops = serializers.IntegerField()
    estimated_cost = serializers.FloatField()
    score_percent = serializers.IntegerField()


class OptimizeResponseSerializer(serializers.Serializer):
    optimization_score = serializers.FloatField()
    total_distance_miles = serializers.FloatField()
    total_driving_hours = serializers.FloatField()
    total_trip_hours = serializers.FloatField()
    fuel_summary = serializers.DictField()
    rest_summary = serializers.DictField()
    route_comparison = serializers.DictField()
    alternative_routes = AlternativeRouteSerializer(many=True)
    optimized_stops = serializers.ListField(child=serializers.DictField())
