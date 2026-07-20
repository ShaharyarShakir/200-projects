from django.urls import path
from .views import GeocodeView, RouteView, LocationSearchView, LocationReverseView

urlpatterns = [
    path('search', LocationSearchView.as_view(), name='location_search'),
    path('reverse', LocationReverseView.as_view(), name='location_reverse'),
    path('geocode', GeocodeView.as_view(), name='geocode'),
    path('route', RouteView.as_view(), name='route'),
]

