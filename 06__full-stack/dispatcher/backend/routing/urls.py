from django.urls import path
from .views import (
    GeocodeView,
    RouteView,
    RouteDetailView,
    LocationSearchView,
    LocationReverseView,
)

urlpatterns = [
    path('search', LocationSearchView.as_view(), name='location_search'),
    path('reverse', LocationReverseView.as_view(), name='location_reverse'),
    path('geocode', GeocodeView.as_view(), name='geocode'),
    path('route', RouteView.as_view(), name='route'),
    path('<uuid:trip_id>', RouteDetailView.as_view(), name='route_detail'),
]
