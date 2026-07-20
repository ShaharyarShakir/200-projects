from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from trips.models import Trip

User = get_user_model()

class RoutingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='driver@example.com', password='Password123!')

    def test_geocode_success(self):
        url = reverse('geocode')
        response = self.client.post(url, {'address': 'Lahore'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('lat', response.data)
        self.assertIn('lng', response.data)
        self.assertIsInstance(response.data['lat'], float)
        self.assertIsInstance(response.data['lng'], float)

    def test_geocode_invalid_empty_address(self):
        url = reverse('geocode')
        response = self.client.post(url, {'address': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_route_calculation_success_with_arrays(self):
        url = reverse('route')
        payload = {
            'origin': [74.35, 31.52],
            'pickup': [74.38, 31.56],
            'dropoff': [73.04, 33.68]
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('distance', response.data)
        self.assertIn('duration', response.data)
        self.assertIn('geometry', response.data)
        self.assertIn('steps', response.data)
        self.assertIn('summary', response.data)
        self.assertGreater(response.data['distance'], 0)
        self.assertGreater(response.data['duration'], 0)
        self.assertIsInstance(response.data['steps'], list)

    def test_route_calculation_success_with_objects(self):
        url = reverse('route')
        payload = {
            'current': {'lat': 31.5204, 'lng': 74.3587},
            'pickup': {'lat': 33.6844, 'lng': 73.0479},
            'dropoff': {'lat': 24.8607, 'lng': 67.0011}
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('distance', response.data)
        self.assertIn('duration', response.data)
        self.assertIn('summary', response.data)
        self.assertIn('distance_km', response.data['summary'])

    def test_route_detail_view_authenticated(self):
        trip = Trip.objects.create(
            user=self.user,
            current_location='Lahore',
            current_lat=31.5204,
            current_lng=74.3587,
            pickup_location='Rawalpindi',
            pickup_lat=33.5651,
            pickup_lng=73.0169,
            dropoff_location='Islamabad',
            dropoff_lat=33.6844,
            dropoff_lng=73.0479,
            current_cycle_used=Decimal('10.00')
        )
        self.client.force_authenticate(user=self.user)
        url = reverse('route_detail', kwargs={'trip_id': trip.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('geometry', response.data)
        self.assertIn('summary', response.data)
        
        # Verify persistence on trip model
        trip.refresh_from_db()
        self.assertIsNotNone(trip.distance_meters)
        self.assertIsNotNone(trip.duration_seconds)
        self.assertTrue(len(trip.route_geometry) > 0)

    def test_location_search_success(self):
        url = reverse('location_search')
        response = self.client.get(url, {'q': 'lahore'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

    def test_location_reverse_success(self):
        url = reverse('location_reverse')
        response = self.client.get(url, {'lat': 31.52, 'lng': 74.35})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('display_name', response.data)
