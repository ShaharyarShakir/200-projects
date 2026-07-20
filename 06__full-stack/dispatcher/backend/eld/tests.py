from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from trips.models import Trip
from hos.services.schedule_engine import ScheduleEngine
from .models import DailyLog, DutyEvent, DutyStatus
from .services.log_generator import ELDLogGenerator
from .services.pdf_export import ELDPDFExporter

User = get_user_model()


class ELDLogEngineUnitTests(APITestCase):

    def setUp(self):
        self.engine = ScheduleEngine()
        self.log_gen = ELDLogGenerator()

    def test_single_day_log_generation_totals_24_hours(self):
        # Short 5 hour trip -> single calendar day
        sched = self.engine.generate_schedule(distance=250, duration=5.0, cycle_used=0.0)
        logs = self.log_gen.generate_daily_logs(events=sched["events"], persist=False)

        self.assertGreaterEqual(len(logs), 1)
        day1 = logs[0]
        # Sum of driving, duty, sleeper, off duty hours must equal exactly 24.0 hours
        total_h = day1["summary"]["total_hours"]
        self.assertEqual(total_h, 24.0)
        self.assertGreater(day1["summary"]["driving_hours"], 0)

    def test_multi_day_log_generation_totals_24_hours_per_day(self):
        # 1,842 miles, 27.4 hours driving -> spans across ~3 to 4 days
        sched = self.engine.generate_schedule(distance=1842, duration=27.4, cycle_used=25.0)
        logs = self.log_gen.generate_daily_logs(events=sched["events"], persist=False)

        self.assertGreater(len(logs), 1)
        for log in logs:
            total_h = log["summary"]["total_hours"]
            self.assertEqual(total_h, 24.0)

    def test_duty_status_mapping(self):
        self.assertEqual(self.log_gen.map_event_type("pickup"), DutyStatus.ON_DUTY)
        self.assertEqual(self.log_gen.map_event_type("drive"), DutyStatus.DRIVING)
        self.assertEqual(self.log_gen.map_event_type("break"), DutyStatus.OFF_DUTY)
        self.assertEqual(self.log_gen.map_event_type("fuel"), DutyStatus.ON_DUTY)
        self.assertEqual(self.log_gen.map_event_type("sleep"), DutyStatus.SLEEPER_BERTH)
        self.assertEqual(self.log_gen.map_event_type("dropoff"), DutyStatus.ON_DUTY)

    def test_pdf_export_byte_generation(self):
        sched = self.engine.generate_schedule(distance=1842, duration=27.4, cycle_used=25.0)
        logs = self.log_gen.generate_daily_logs(events=sched["events"], persist=False)

        exporter = ELDPDFExporter()
        pdf_bytes = exporter.export_pdf(logs)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 1000)


class ELDAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(email='driver_eld@example.com', password='Password123!')
        self.trip = Trip.objects.create(
            user=self.user,
            current_location='New York, NY',
            pickup_location='Chicago, IL',
            dropoff_location='Los Angeles, CA',
            distance_meters=2800000.0,
            duration_seconds=97200.0,
            current_cycle_used=Decimal('25.00'),
            status=Trip.Status.DRAFT
        )

    def test_generate_eld_logs_api_standalone(self):
        payload = {
            "distance": 1842,
            "duration": 27.4,
            "cycle_used": 25,
            "driver_name": "Test Driver"
        }
        res = self.client.post('/api/eld/generate', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("logs", res.data)
        self.assertGreater(len(res.data["logs"]), 1)
        self.assertEqual(res.data["logs"][0]["summary"]["total_hours"], 24.0)

    def test_generate_eld_logs_api_with_trip_id(self):
        payload = {
            "trip_id": str(self.trip.id),
            "driver_name": "Main Driver"
        }
        res = self.client.post('/api/eld/generate', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["trip_id"], str(self.trip.id))

        # DB persistence check
        logs_db = DailyLog.objects.filter(trip=self.trip)
        self.assertEqual(logs_db.count(), res.data["total_days"])

        # GET API check
        get_res = self.client.get(f'/api/eld/{self.trip.id}')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["total_days"], logs_db.count())

    def test_export_pdf_api_endpoint(self):
        pdf_res = self.client.get(f'/api/eld/{self.trip.id}/pdf')
        self.assertEqual(pdf_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_res['Content-Type'], 'application/pdf')
        self.assertTrue(pdf_res.content.startswith(b'%PDF'))

    def test_sample_scenario_pdf_export_api(self):
        pdf_res = self.client.get('/api/eld/sample/pdf')
        self.assertEqual(pdf_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_res['Content-Type'], 'application/pdf')
        self.assertTrue(pdf_res.content.startswith(b'%PDF'))
