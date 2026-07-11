"""
URL configuration for rabbitcrm project.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/jwt/create/", TokenObtainPairView.as_view(), name="jwt-create"),
    path("api/auth/jwt/refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("api/", include("rabbitcrm.core.urls")),
    path("api/rabbits/", include("rabbitcrm.apps.rabbits.urls")),
    path("api/housing/", include("rabbitcrm.apps.housing.urls")),
    path("api/health/", include("rabbitcrm.apps.health.urls")),
    path("api/feeding/", include("rabbitcrm.apps.feeding.urls")),
    path("api/breeding/", include("rabbitcrm.apps.breeding.urls")),
    path("api/analytics/", include("rabbitcrm.apps.analytics.urls")),
]
