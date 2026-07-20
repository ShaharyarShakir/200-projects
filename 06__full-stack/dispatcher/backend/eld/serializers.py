from rest_framework import serializers
from .models import DailyLog, DutyEvent


class DutyEventSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = DutyEvent
        fields = [
            'id',
            'type',
            'type_display',
            'start_time',
            'end_time',
            'duration',
            'location',
            'notes'
        ]


class DailyLogSerializer(serializers.ModelSerializer):
    duty_events = DutyEventSerializer(many=True, read_only=True)

    class Meta:
        model = DailyLog
        fields = [
            'id',
            'trip',
            'day_number',
            'date',
            'total_distance',
            'driving_hours',
            'duty_hours',
            'sleeper_hours',
            'off_duty_hours',
            'cycle_hours',
            'graph_data',
            'summary',
            'driver_info',
            'trip_info',
            'duty_events',
            'created_at'
        ]


class ELDGenerateSerializer(serializers.Serializer):
    trip_id = serializers.UUIDField(required=False, allow_null=True)
    distance = serializers.FloatField(required=False, min_value=0.1)
    duration = serializers.FloatField(required=False, min_value=0.1)
    cycle_used = serializers.FloatField(required=False, min_value=0.0, max_value=70.0, default=0.0)
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    driver_name = serializers.CharField(required=False, allow_blank=True, default="John Doe")
    carrier = serializers.CharField(required=False, allow_blank=True, default="Apex Logistics Inc.")
    vehicle_number = serializers.CharField(required=False, allow_blank=True, default="Truck #402")
    trailer_number = serializers.CharField(required=False, allow_blank=True, default="TR-881")
