import uuid
from django.db import models


class TripSchedule(models.Model):
    class EventType(models.TextChoices):
        PICKUP = 'pickup', 'Pickup'
        DRIVE = 'drive', 'Drive'
        BREAK = 'break', 'Break'
        FUEL = 'fuel', 'Fuel Stop'
        SLEEP = 'sleep', 'Sleep / Rest'
        DROPOFF = 'dropoff', 'Dropoff'
        OFF_DUTY = 'off_duty', 'Off Duty'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(
        'trips.Trip',
        on_delete=models.CASCADE,
        related_name='schedules',
        null=True,
        blank=True
    )
    order = models.IntegerField(default=1)
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.FloatField(help_text="Duration in hours")
    distance = models.FloatField(default=0.0, help_text="Distance in miles")
    location = models.CharField(max_length=255, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['trip', 'order']

    def __str__(self):
        return f"Schedule #{self.order}: {self.get_event_type_display()} ({self.duration}h)"
