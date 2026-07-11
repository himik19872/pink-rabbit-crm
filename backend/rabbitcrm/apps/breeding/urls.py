from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BreedingPairViewSet, MatingViewSet, PregnancyViewSet, KindlingViewSet, KindlingDetailViewSet, GenealogicalLineViewSet, RabbitLineViewSet

router = DefaultRouter()
router.register(r"pairs", BreedingPairViewSet)
router.register(r"matings", MatingViewSet)
router.register(r"pregnancies", PregnancyViewSet)
router.register(r"kindlings", KindlingViewSet)
router.register(r"details", KindlingDetailViewSet)
router.register(r"lines", GenealogicalLineViewSet)
router.register(r"rabbit-lines", RabbitLineViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
