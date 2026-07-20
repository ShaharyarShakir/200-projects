from decimal import Decimal
from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    current_cycle_used = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal('0.00'),
        max_value=Decimal('70.00')
    )

    class Meta:
        model = Trip
        fields = [
            'id',
            'user',
            'user_email',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'current_cycle_used',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'user_email', 'created_at', 'updated_at']

    def validate_current_location(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Current location must be at least 2 characters long.")
        return value.strip()

    def validate_pickup_location(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Pickup location must be at least 2 characters long.")
        return value.strip()

    def validate_dropoff_location(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Dropoff location must be at least 2 characters long.")
        return value.strip()
