from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeedTypeViewSet, FeedViewSet, FeedStockViewSet, FeedDistributionViewSet, DailyFeedPlanViewSet, FeedPurchaseViewSet

router = DefaultRouter()
router.register(r"types", FeedTypeViewSet)
router.register(r"feeds", FeedViewSet)
router.register(r"stocks", FeedStockViewSet)
router.register(r"distributions", FeedDistributionViewSet)
router.register(r"plans", DailyFeedPlanViewSet)
router.register(r"purchases", FeedPurchaseViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
