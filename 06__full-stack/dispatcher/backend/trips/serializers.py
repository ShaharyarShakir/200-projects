from decimal import Decimal
from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    current_cycle_used = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal("0.00"),
        max_value=Decimal("70.00"),
    )

    current_location = serializers.CharField(required=False, allow_blank=True)
    pickup_location = serializers.CharField(required=False, allow_blank=True)
    dropoff_location = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "user",
            "user_email",
            "current_location",
            "current_location_name",
            "current_lat",
            "current_lng",
            "pickup_location",
            "pickup_name",
            "pickup_lat",
            "pickup_lng",
            "dropoff_location",
            "dropoff_name",
            "dropoff_lat",
            "dropoff_lng",
            "current_cycle_used",
            "distance_meters",
            "duration_seconds",
            "route_geometry",
            "route_summary",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "user_email", "created_at", "updated_at"]

    def validate(self, attrs):
        curr = (
            attrs.get("current_location_name")
            or attrs.get("current_location")
            or getattr(self.instance, "current_location_name", "")
            or getattr(self.instance, "current_location", "")
        )
        pick = (
            attrs.get("pickup_name")
            or attrs.get("pickup_location")
            or getattr(self.instance, "pickup_name", "")
            or getattr(self.instance, "pickup_location", "")
        )
        drop = (
            attrs.get("dropoff_name")
            or attrs.get("dropoff_location")
            or getattr(self.instance, "dropoff_name", "")
            or getattr(self.instance, "dropoff_location", "")
        )

        if (
            self.instance is None
            or "current_location" in attrs
            or "current_location_name" in attrs
        ):
            if not curr or len(curr.strip()) < 2:
                raise serializers.ValidationError(
                    {
                        "current_location": "Current location must be at least 2 characters long."
                    }
                )
            attrs["current_location"] = curr.strip()
            attrs["current_location_name"] = curr.strip()

        if (
            self.instance is None
            or "pickup_location" in attrs
            or "pickup_name" in attrs
        ):
            if not pick or len(pick.strip()) < 2:
                raise serializers.ValidationError(
                    {
                        "pickup_location": "Pickup location must be at least 2 characters long."
                    }
                )
            attrs["pickup_location"] = pick.strip()
            attrs["pickup_name"] = pick.strip()

        if (
            self.instance is None
            or "dropoff_location" in attrs
            or "dropoff_name" in attrs
        ):
            if not drop or len(drop.strip()) < 2:
                raise serializers.ValidationError(
                    {
                        "dropoff_location": "Dropoff location must be at least 2 characters long."
                    }
                )
            attrs["dropoff_location"] = drop.strip()
            attrs["dropoff_name"] = drop.strip()

        return attrs
