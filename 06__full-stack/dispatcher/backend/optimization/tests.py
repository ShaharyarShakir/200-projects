from datetime import datetime, timezone
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from trips.models import Trip
from .models import Stop
from .services.stop_locator import StopLocatorService
from .services.fuel_service import FuelService
from .services.rest_service import RestService
from .services.eta_engine import ETAEngine
from .services.optimizer import RouteOptimizer

User = get_user_model()


class StopModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="driver@example.com", password="password123"
        )
        self.trip = Trip.objects.create(
            user=self.user,
            current_location="Dallas, TX",
            pickup_location="Oklahoma City, OK",
            dropoff_location="Tulsa, OK",
        )

    def test_create_stop(self):
        stop = Stop.objects.create(
            trip=self.trip,
            name="Pilot Flying J",
            category=Stop.Category.FUEL,
            latitude=32.7767,
            longitude=-96.7970,
            distance_from_start=150.5,
            duration=0.5,
            priority=95.0,
            source="OpenStreetMap",
            metadata={"truck_friendly": True, "open_24h": True},
        )
        self.assertEqual(stop.name, "Pilot Flying J")
        self.assertEqual(stop.category, "Fuel")
        self.assertTrue(stop.metadata["truck_friendly"])
        self.assertIn("Pilot Flying J", str(stop))


class ServicesTest(TestCase):
    def test_fuel_service(self):
        fuel_res = FuelService.calculate_fuel_requirements(
            1200.0, mpg=6.0, tank_capacity=150.0
        )
        self.assertEqual(fuel_res["distance_miles"], 1200.0)
        self.assertEqual(fuel_res["gallons_needed"], 200.0)
        self.assertGreater(fuel_res["estimated_fuel_cost"], 0)

    def test_rest_service(self):
        rest_res = RestService.analyze_rest_needs(
            driving_duration_hours=15.0, current_cycle_used=10.0
        )
        self.assertEqual(rest_res["breaks_30m_needed"], 1)
        self.assertEqual(rest_res["sleeps_10h_needed"], 1)

    def test_eta_engine(self):
        stops = [
            {"name": "Start", "distance_from_start": 0.0, "duration": 1.0},
            {"name": "Stop 1", "distance_from_start": 110.0, "duration": 0.5},
            {"name": "Destination", "distance_from_start": 220.0, "duration": 1.0},
        ]
        start_t = datetime(2026, 7, 21, 8, 0, 0, tzinfo=timezone.utc)
        eta_res = ETAEngine.calculate_timestamps(
            stops, start_datetime=start_t, avg_speed_mph=55.0
        )

        self.assertIn("start_time", eta_res)
        self.assertEqual(len(eta_res["stops"]), 3)
        self.assertIn("arrival_time", eta_res["stops"][1])
        self.assertIn("departure_time", eta_res["stops"][1])

    def test_stop_locator(self):
        geometry = [[32.7767, -96.7970], [33.6844, -73.0479], [34.0522, -118.2437]]
        stops = StopLocatorService.locate_stops_along_route(
            geometry, total_distance_miles=500.0, use_external_api=False
        )
        self.assertGreater(len(stops), 0)
        for s in stops:
            self.assertIn("priority", s)
            self.assertIn("metadata", s)


class RouteOptimizerTest(TestCase):
    def test_route_optimizer(self):
        geometry = [[32.7767, -96.7970], [35.4676, -97.5164], [36.1540, -95.9928]]
        result = RouteOptimizer.optimize_route(
            geometry=geometry,
            distance_meters=1842000.0,
            duration_seconds=97200.0,  # ~27h
            cycle_used=10.0,
            pickup_name="Dallas Pickup",
            dropoff_name="Missouri Dropoff",
        )

        self.assertIn("optimization_score", result)
        self.assertIn("route_comparison", result)
        self.assertIn("alternative_routes", result)
        self.assertGreater(len(result["optimized_stops"]), 2)
        # Check categories present
        categories = [s["category"] for s in result["optimized_stops"]]
        self.assertTrue(
            any(c in ["Fuel", "Truck Stop", "Rest Area", "Hotel"] for c in categories)
        )


class OptimizationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="driver_api@example.com", password="password123"
        )
        self.trip = Trip.objects.create(
            user=self.user,
            current_location="Dallas, TX",
            pickup_location="Oklahoma City, OK",
            dropoff_location="Tulsa, OK",
            route_geometry=[[32.7767, -96.7970], [35.4676, -97.5164]],
            distance_meters=300000.0,
            duration_seconds=18000.0,
        )

    def test_optimize_endpoint(self):
        url = "/api/optimization/optimize"
        payload = {"tripId": str(self.trip.id)}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("optimization_score", response.data)
        self.assertIn("optimized_stops", response.data)

    def test_optimize_adhoc_endpoint(self):
        url = "/api/optimization/optimize"
        payload = {
            "current_location": "Dallas, TX",
            "pickup_location": "Oklahoma City, OK",
            "dropoff_location": "Tulsa, OK",
            "current_cycle_used": 15.0,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("route_comparison", response.data)

    def test_alternatives_endpoint(self):
        url = f"/api/optimization/alternatives/{self.trip.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_stops_crud_endpoint(self):
        stop = Stop.objects.create(
            trip=self.trip,
            name="Love's Travel Stop",
            category="Truck Stop",
            latitude=35.4676,
            longitude=-97.5164,
            distance_from_start=120.0,
        )
        url = f"/api/optimization/stops/{stop.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Love's Travel Stop")
