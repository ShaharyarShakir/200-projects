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

    def test_location_search_success(self):
        url = reverse('location_search')
        response = self.client.get(url, {'q': 'lahore'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)
        item = response.data[0]
        self.assertIn('display_name', item)
        self.assertIn('lat', item)
        self.assertIn('lng', item)
        self.assertIn('place_id', item)

    def test_location_search_empty(self):
        url = reverse('location_search')
        response = self.client.get(url, {'q': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_location_reverse_success(self):
        url = reverse('location_reverse')
        response = self.client.get(url, {'lat': 31.52, 'lng': 74.35})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('display_name', response.data)
        self.assertEqual(response.data['lat'], 31.52)
        self.assertEqual(response.data['lng'], 74.35)

    def test_location_reverse_invalid(self):
        url = reverse('location_reverse')
        response = self.client.get(url, {'lat': 120.0, 'lng': 74.35}) # Invalid lat > 90
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

