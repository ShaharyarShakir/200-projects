from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Trip
from .serializers import TripSerializer

User = get_user_model()


class TripModelTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="driver@example.com", password="Password123!"
        )

    def test_create_trip(self):
        trip = Trip.objects.create(
            user=self.user,
            current_location="Lahore",
            pickup_location="Islamabad",
            dropoff_location="Karachi",
            current_cycle_used=Decimal("22.50"),
        )
        self.assertEqual(trip.status, Trip.Status.DRAFT)
        self.assertEqual(trip.current_cycle_used, Decimal("22.50"))
        self.assertIn("Lahore", str(trip))


class TripSerializerTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="driver@example.com", password="Password123!"
        )

    def test_valid_serializer_data(self):
        data = {
            "current_location": "Lahore",
            "pickup_location": "Islamabad",
            "dropoff_location": "Karachi",
            "current_cycle_used": 15.0,
            "status": "Draft",
            "notes": "Urgent cargo",
        }
        serializer = TripSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_cycle_hours_exceeded(self):
        data = {
            "current_location": "Lahore",
            "pickup_location": "Islamabad",
            "dropoff_location": "Karachi",
            "current_cycle_used": 75.0,
        }
        serializer = TripSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("current_cycle_used", serializer.errors)

    def test_invalid_empty_location(self):
        data = {
            "current_location": "   ",
            "pickup_location": "Islamabad",
            "dropoff_location": "Karachi",
            "current_cycle_used": 10.0,
        }
        serializer = TripSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("current_location", serializer.errors)


class TripAPITestCase(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email="user1@example.com", password="Password123!"
        )
        self.user2 = User.objects.create_user(
            email="user2@example.com", password="Password123!"
        )

        self.trip1 = Trip.objects.create(
            user=self.user1,
            current_location="Lahore",
            pickup_location="Rawalpindi",
            dropoff_location="Islamabad",
            current_cycle_used=Decimal("12.00"),
            status=Trip.Status.DRAFT,
        )
        self.trip2 = Trip.objects.create(
            user=self.user2,
            current_location="Karachi",
            pickup_location="Hyderabad",
            dropoff_location="Multan",
            current_cycle_used=Decimal("40.00"),
            status=Trip.Status.COMPLETED,
        )

    def test_unauthenticated_access_denied(self):
        response = self.client.get("/api/trips/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_user_own_trips_only(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get("/api/trips/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], str(self.trip1.id))

    def test_create_trip_api(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            "current_location": "Peshawar",
            "pickup_location": "Mardan",
            "dropoff_location": "Swat",
            "current_cycle_used": 5.5,
            "notes": "Test trip",
        }
        response = self.client.post("/api/trips/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "Draft")
        self.assertEqual(Trip.objects.filter(user=self.user1).count(), 2)

    def test_filter_trips_by_status(self):
        self.client.force_authenticate(user=self.user1)
        # Create a second trip for user1
        Trip.objects.create(
            user=self.user1,
            current_location="Quetta",
            pickup_location="Chaman",
            dropoff_location="Sibi",
            current_cycle_used=Decimal("18.00"),
            status=Trip.Status.COMPLETED,
        )
        response = self.client.get("/api/trips/?status=Completed")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["current_location"], "Quetta")

    def test_update_trip(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/trips/{self.trip1.id}/"
        payload = {"status": "Completed"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.trip1.refresh_from_db()
        self.assertEqual(self.trip1.status, Trip.Status.COMPLETED)

    def test_delete_trip(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/trips/{self.trip1.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Trip.objects.filter(id=self.trip1.id).exists())

    def test_user_cannot_access_other_users_trip(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/trips/{self.trip2.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_trip_plan_api(self):
        payload = {
            "current_location": "Chicago",
            "pickup_location": "St. Louis",
            "dropoff_location": "Dallas",
            "current_cycle_used": 10.0,
        }
        response = self.client.post("/api/trip-plan/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("locations", response.data)
        self.assertIn("route", response.data)
        self.assertIn("daily_logs", response.data)
        self.assertIn("summary", response.data)
