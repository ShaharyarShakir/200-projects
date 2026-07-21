import uuid
from django.db import models


class DutyStatus(models.TextChoices):
    OFF_DUTY = "OFF_DUTY", "Off Duty"
    SLEEPER_BERTH = "SLEEPER_BERTH", "Sleeper Berth"
    DRIVING = "DRIVING", "Driving"
    ON_DUTY = "ON_DUTY", "On Duty (Not Driving)"


class DailyLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="daily_logs",
        null=True,
        blank=True,
    )
    day_number = models.IntegerField(default=1)
    date = models.DateField()
    total_distance = models.FloatField(
        default=0.0, help_text="Miles driven on this day"
    )
    driving_hours = models.FloatField(
        default=0.0, help_text="Total driving hours (max 11)"
    )
    duty_hours = models.FloatField(
        default=0.0, help_text="Total on-duty non-driving hours"
    )
    sleeper_hours = models.FloatField(
        default=0.0, help_text="Total sleeper berth hours"
    )
    off_duty_hours = models.FloatField(default=0.0, help_text="Total off duty hours")
    cycle_hours = models.FloatField(
        default=0.0, help_text="Cumulative cycle hours used at day end"
    )
    graph_data = models.JSONField(
        default=list, help_text="24-hour timeline grid segments"
    )
    summary = models.JSONField(
        default=dict, help_text="Detailed metrics and stop counters"
    )
    driver_info = models.JSONField(
        default=dict, help_text="Driver name, license, carrier, etc."
    )
    trip_info = models.JSONField(
        default=dict, help_text="Trip origin, pickup, dropoff, total dist"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["day_number", "date"]

    def __str__(self):
        return f"DailyLog Day #{self.day_number} ({self.date}) - Trip {self.trip_id or 'Standalone'}"


class DutyEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_log = models.ForeignKey(
        DailyLog, on_delete=models.CASCADE, related_name="duty_events"
    )
    type = models.CharField(max_length=20, choices=DutyStatus.choices)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.FloatField(help_text="Duration in hours")
    location = models.CharField(max_length=255, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.get_type_display()} ({self.duration}h) on Day {self.daily_log.day_number}"
