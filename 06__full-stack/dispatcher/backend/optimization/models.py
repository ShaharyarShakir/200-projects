import uuid
from django.db import models
from trips.models import Trip


class Stop(models.Model):
    class Category(models.TextChoices):
        FUEL = "Fuel", "Fuel"
        TRUCK_STOP = "Truck Stop", "Truck Stop"
        REST_AREA = "Rest Area", "Rest Area"
        PARKING = "Parking", "Parking"
        HOTEL = "Hotel", "Hotel"
        FOOD = "Food", "Food"
        MAINTENANCE = "Maintenance", "Maintenance"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(
        Trip, on_delete=models.CASCADE, related_name="stops", null=True, blank=True
    )
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50, choices=Category.choices, default=Category.TRUCK_STOP
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    distance_from_start = models.FloatField(
        default=0.0, help_text="Distance from route origin in miles"
    )
    arrival_time = models.DateTimeField(null=True, blank=True)
    departure_time = models.DateTimeField(null=True, blank=True)
    duration = models.FloatField(default=0.5, help_text="Stop duration in hours")
    priority = models.FloatField(default=5.0, help_text="Scoring priority out of 100")
    source = models.CharField(max_length=100, default="OpenStreetMap")
    is_locked = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "distance_from_start"]

    def __str__(self):
        return f"{self.name} ({self.category}) - Mile {self.distance_from_start}"
