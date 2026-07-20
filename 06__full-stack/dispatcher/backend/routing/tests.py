from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

class RoutingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

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

    def test_route_calculation_success(self):
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
        self.assertGreater(response.data['distance'], 0)
        self.assertGreater(response.data['duration'], 0)
        self.assertIsInstance(response.data['geometry'], list)

    def test_route_calculation_invalid_coords(self):
        url = reverse('route')
        payload = {
            'origin': [74.35, 131.52], # Invalid lat > 90
            'pickup': [74.38, 31.56],
            'dropoff': [73.04, 33.68]
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
