from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("auth_register")
        self.login_url = reverse("auth_login")
        self.me_url = reverse("auth_me")
        self.health_url = reverse("health_check")

        self.user_data = {
            "email": "driver@dispatch.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe",
        }

    def test_health_check(self):
        response = self.client.get(self.health_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["database"], "connected")

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], self.user_data["email"])

    def test_user_login(self):
        User.objects.create_user(**self.user_data)
        login_payload = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])

    def test_authenticated_me_endpoint(self):
        User.objects.create_user(**self.user_data)
        login_payload = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        login_resp = self.client.post(self.login_url, login_payload, format="json")
        token = login_resp.data["tokens"]["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_resp = self.client.get(self.me_url)
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(me_resp.data["email"], self.user_data["email"])

    def test_unauthenticated_me_endpoint(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
