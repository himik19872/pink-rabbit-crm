from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthEventViewSet, MedicalRecordViewSet, QuarantineViewSet

router = DefaultRouter()
router.register(r"events", HealthEventViewSet)
router.register(r"records", MedicalRecordViewSet)
router.register(r"quarantines", QuarantineViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
