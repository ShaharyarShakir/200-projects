import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Trip(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        PLANNING = 'Planning', 'Planning'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trips'
    )
    current_location = models.CharField(max_length=255)
    current_location_name = models.CharField(max_length=255, blank=True, default='')
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)

    pickup_location = models.CharField(max_length=255)
    pickup_name = models.CharField(max_length=255, blank=True, default='')
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)

    dropoff_location = models.CharField(max_length=255)
    dropoff_name = models.CharField(max_length=255, blank=True, default='')
    dropoff_lat = models.FloatField(null=True, blank=True)
    dropoff_lng = models.FloatField(null=True, blank=True)

    current_cycle_used = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('70.00'))
        ]
    )

    distance_meters = models.FloatField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    route_geometry = models.JSONField(default=list, blank=True)
    route_summary = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.current_location_name and self.current_location:
            self.current_location_name = self.current_location
        elif self.current_location_name and not self.current_location:
            self.current_location = self.current_location_name
        elif self.current_location_name:
            self.current_location = self.current_location_name

        if not self.pickup_name and self.pickup_location:
            self.pickup_name = self.pickup_location
        elif self.pickup_name and not self.pickup_location:
            self.pickup_location = self.pickup_name
        elif self.pickup_name:
            self.pickup_location = self.pickup_name

        if not self.dropoff_name and self.dropoff_location:
            self.dropoff_name = self.dropoff_location
        elif self.dropoff_name and not self.dropoff_location:
            self.dropoff_location = self.dropoff_name
        elif self.dropoff_name:
            self.dropoff_location = self.dropoff_name

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Trip {self.id} ({self.current_location} -> {self.dropoff_location}) - {self.status}"

