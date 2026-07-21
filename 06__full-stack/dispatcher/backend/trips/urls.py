from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripViewSet
from .views_plan import TripPlanView

router = DefaultRouter()
router.register(r"", TripViewSet, basename="trip")

urlpatterns = [
    path("plan/", TripPlanView.as_view(), name="trip_plan"),
    path("", include(router.urls)),
]
