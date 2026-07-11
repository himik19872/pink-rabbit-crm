from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BuildingViewSet, RowViewSet, ShelfViewSet, CageViewSet, CageMoveViewSet, WaterConsumptionViewSet

router = DefaultRouter()
router.register(r"buildings", BuildingViewSet)
router.register(r"rows", RowViewSet)
router.register(r"shelves", ShelfViewSet)
router.register(r"cages", CageViewSet)
router.register(r"moves", CageMoveViewSet)
router.register(r"water", WaterConsumptionViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
