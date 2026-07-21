from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OptimizeView, AlternativeRoutesView, StopViewSet

router = DefaultRouter()
router.register(r"stops", StopViewSet, basename="stop")

urlpatterns = [
    path("optimize", OptimizeView.as_view(), name="optimize_route"),
    path(
        "alternatives/<uuid:tripId>",
        AlternativeRoutesView.as_view(),
        name="alternative_routes",
    ),
    path("", include(router.urls)),
]
