from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Trip
from .serializers import TripSerializer
from .permissions import IsOwner


class TripViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing, creating, updating, and deleting Trip records.
    Every user only has access to their own trips.
    """

    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    search_fields = ["current_location", "pickup_location", "dropoff_location", "notes"]
    ordering_fields = ["created_at", "updated_at", "current_cycle_used"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Users can only view their own trips
        if (
            getattr(self, "swagger_fake_view", False)
            or not self.request.user.is_authenticated
        ):
            return Trip.objects.none()
        return Trip.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
