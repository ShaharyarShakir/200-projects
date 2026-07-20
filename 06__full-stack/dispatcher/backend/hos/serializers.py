from rest_framework import serializers
from .models import TripSchedule


class HOSEngineInputSerializer(serializers.Serializer):
    distance = serializers.FloatField(required=False, min_value=0.01)
    duration = serializers.FloatField(required=False, min_value=0.01)
    cycle_used = serializers.FloatField(required=False, default=0.0, min_value=0.0, max_value=70.0)
    trip_id = serializers.UUIDField(required=False, allow_null=True)
    start_time = serializers.DateTimeField(required=False, allow_null=True)

    def validate(self, attrs):
        trip_id = attrs.get('trip_id')
        distance = attrs.get('distance')
        duration = attrs.get('duration')

        if not trip_id and (distance is None or duration is None):
            raise serializers.ValidationError("Either 'trip_id' or both 'distance' and 'duration' must be provided.")
        return attrs


class TripScheduleSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = TripSchedule
        fields = [
            'id',
            'trip',
            'order',
            'event_type',
            'event_type_display',
            'start_time',
            'end_time',
            'duration',
            'distance',
            'location',
            'notes',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
