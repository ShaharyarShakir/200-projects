"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from users.views import HealthCheckView
from trips.views_plan import TripPlanView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", HealthCheckView.as_view(), name="health_check"),
    path("api/trip-plan/", TripPlanView.as_view(), name="trip_plan_api"),
    path("api/auth/", include("users.urls")),
    path("api/trips/", include("trips.urls")),
    path("api/routing/", include("routing.urls")),
    path("api/hos/", include("hos.urls")),
    path("api/eld/", include("eld.urls")),
    path("api/optimization/", include("optimization.urls")),
]
