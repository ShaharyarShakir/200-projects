from django.urls import path
from .views import HOSGenerateView, TripScheduleView

app_name = 'hos'

urlpatterns = [
    path('generate/', HOSGenerateView.as_view(), name='generate_schedule'),
    path('generate', HOSGenerateView.as_view(), name='generate_schedule_slashless'),
    path('schedule/<uuid:trip_id>/', TripScheduleView.as_view(), name='trip_schedule'),
]
