from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeedTypeViewSet, FeedViewSet, FeedStockViewSet, FeedDistributionViewSet, DailyFeedPlanViewSet

router = DefaultRouter()
router.register(r"types", FeedTypeViewSet)
router.register(r"feeds", FeedViewSet)
router.register(r"stocks", FeedStockViewSet)
router.register(r"distributions", FeedDistributionViewSet)
router.register(r"plans", DailyFeedPlanViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
