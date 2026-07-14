from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RabbitViewSet, WeightViewSet, RabbitPhotoViewSet, SlaughterViewSet

router = DefaultRouter()
router.register(r"rabbits", RabbitViewSet)
router.register(r"weights", WeightViewSet)
router.register(r"photos", RabbitPhotoViewSet)
router.register(r"slaughters", SlaughterViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
