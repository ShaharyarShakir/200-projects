from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from trips.models import Trip
from .models import TripSchedule
from .services.schedule_engine import ScheduleEngine
from .services.hos_engine import HOSConfig
from .services.cycle_engine import CycleEngine
from .services.fuel_engine import FuelEngine

User = get_user_model()


class HOSEngineUnitTests(APITestCase):
    def test_fmcsa_constants(self):
        self.assertEqual(HOSConfig.MAX_DRIVING_HOURS, 11.0)
        self.assertEqual(HOSConfig.MAX_DUTY_HOURS, 14.0)
        self.assertEqual(HOSConfig.BREAK_AFTER_DRIVE_HOURS, 8.0)
        self.assertEqual(HOSConfig.BREAK_DURATION_HOURS, 0.5)
        self.assertEqual(HOSConfig.SLEEP_DURATION_HOURS, 10.0)
        self.assertEqual(HOSConfig.CYCLE_MAX_HOURS, 70.0)
        self.assertEqual(HOSConfig.FUEL_INTERVAL_MILES, 1000.0)

    def test_8_hour_driving_break_rule(self):
        engine = ScheduleEngine()
        # 10 hours total driving distance: 500 miles, duration: 10 hours
        result = engine.generate_schedule(distance=500, duration=10, cycle_used=0)
        event_types = [e["type"] for e in result["events"]]

        # Must contain pickup, drive, break (after 8h drive), drive, dropoff
        self.assertIn("break", event_types)
        drive_events = [e for e in result["events"] if e["type"] == "drive"]
        self.assertEqual(drive_events[0]["hours"], 8.0)
        self.assertEqual(drive_events[1]["hours"], 2.0)

    def test_11_hour_driving_and_14_hour_duty_sleep_rule(self):
        engine = ScheduleEngine()
        # 15 hours total driving (requires sleep stop after 11h driving / 14h duty)
        result = engine.generate_schedule(distance=900, duration=15, cycle_used=0)
        event_types = [e["type"] for e in result["events"]]

        self.assertIn("sleep", event_types)
        sleep_events = [e for e in result["events"] if e["type"] == "sleep"]
        self.assertEqual(sleep_events[0]["hours"], 10.0)

    def test_fuel_stop_rule(self):
        engine = ScheduleEngine()
        # 2,200 miles trip duration 40 hours -> should generate fuel stops at 1,000 and 2,000 miles
        fuel_engine = FuelEngine()
        stops = fuel_engine.calculate_fuel_stops(2200)
        self.assertEqual(stops, [1000.0, 2000.0])

        result = engine.generate_schedule(distance=2200, duration=40, cycle_used=0)
        fuel_events = [e for e in result["events"] if e["type"] == "fuel"]
        self.assertEqual(len(fuel_events), 2)

    def test_cycle_limit_and_34h_restart(self):
        engine = ScheduleEngine()
        cycle_engine = CycleEngine()
        valid, msg = cycle_engine.validate_cycle(75.0)
        self.assertFalse(valid)

        # Generating schedule starting with 69 cycle hours used -> should trigger 34h restart
        result = engine.generate_schedule(distance=600, duration=10, cycle_used=69.0)
        event_types = [e["type"] for e in result["events"]]
        self.assertIn("off_duty", event_types)
        restart_events = [e for e in result["events"] if e["type"] == "off_duty"]
        self.assertEqual(restart_events[0]["hours"], 34.0)

    def test_assessment_sample_scenario(self):
        # Sample prompt: 1,842 km / miles, 27.4 hours, 25 hours cycle used
        engine = ScheduleEngine()
        result = engine.generate_schedule(distance=1842, duration=27.4, cycle_used=25)

        events = result["events"]
        event_types = [e["type"] for e in events]

        # Verify event sequence begins with pickup and ends with dropoff
        self.assertEqual(events[0]["type"], "pickup")
        self.assertEqual(events[-1]["type"], "dropoff")

        self.assertIn("break", event_types)
        self.assertIn("sleep", event_types)
        self.assertIn("fuel", event_types)


class HOSAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="driver@example.com", password="Password123!"
        )
        self.trip = Trip.objects.create(
            user=self.user,
            current_location="New York, NY",
            pickup_location="Chicago, IL",
            dropoff_location="Los Angeles, CA",
            distance_meters=2800000.0,  # ~1739.8 miles
            duration_seconds=97200.0,  # 27 hours
            current_cycle_used=Decimal("20.00"),
            status=Trip.Status.DRAFT,
        )

    def test_generate_schedule_direct_payload(self):
        payload = {"distance": 1842, "duration": 27.4, "cycle_used": 25}
        response = self.client.post("/api/hos/generate/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("events", response.data)
        self.assertGreater(len(response.data["events"]), 4)

    def test_generate_schedule_with_trip_id_and_persistence(self):
        payload = {"trip_id": str(self.trip.id)}
        response = self.client.post("/api/hos/generate/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["trip_id"], str(self.trip.id))

        # Check DB persistence
        schedules = TripSchedule.objects.filter(trip=self.trip)
        self.assertGreater(schedules.count(), 0)

        # Check trip status updated to Planning
        self.trip.refresh_from_db()
        self.assertEqual(self.trip.status, Trip.Status.PLANNING)

        # Test GET schedule endpoint
        get_res = self.client.get(f"/api/hos/schedule/{self.trip.id}/")
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data["events"]), schedules.count())

    def test_validation_negative_cycle(self):
        payload = {"distance": 1000, "duration": 15, "cycle_used": -5}
        response = self.client.post("/api/hos/generate/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_cycle_over_70(self):
        payload = {"distance": 1000, "duration": 15, "cycle_used": 75}
        response = self.client.post("/api/hos/generate/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_zero_distance(self):
        payload = {"distance": 0, "duration": 15, "cycle_used": 10}
        response = self.client.post("/api/hos/generate/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
