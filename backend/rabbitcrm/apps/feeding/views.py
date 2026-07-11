from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import FeedType, Feed, FeedStock, FeedDistribution, DailyFeedPlan
from .serializers import (
    FeedTypeSerializer, FeedSerializer, FeedStockSerializer,
    FeedDistributionSerializer, DailyFeedPlanSerializer,
    FeedDistributionWriteSerializer, DailyFeedPlanWriteSerializer
)


class FeedTypeViewSet(viewsets.ModelViewSet):
    """ViewSet для типов кормов"""
    
    queryset = FeedType.objects.all()
    serializer_class = FeedTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category"]


class FeedViewSet(viewsets.ModelViewSet):
    """ViewSet для кормов"""
    
    queryset = Feed.objects.all()
    serializer_class = FeedSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["feed_type", "batch_number"]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        feed_type_id = self.request.query_params.get("feed_type_id")
        if feed_type_id:
            queryset = queryset.filter(feed_type_id=feed_type_id)
        return queryset


class FeedStockViewSet(viewsets.ModelViewSet):
    """ViewSet для склада кормов"""
    
    queryset = FeedStock.objects.all()
    serializer_class = FeedStockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["feed"]


class FeedDistributionViewSet(viewsets.ModelViewSet):
    """ViewSet для раздачи кормов"""
    
    queryset = FeedDistribution.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["rabbit", "feed", "distribution_date", "time_of_day"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return FeedDistributionWriteSerializer
        return FeedDistributionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rabbit_id = self.request.query_params.get("rabbit_id")
        if rabbit_id:
            queryset = queryset.filter(rabbit_id=rabbit_id)
        return queryset


class DailyFeedPlanViewSet(viewsets.ModelViewSet):
    """ViewSet для планов кормления"""
    
    queryset = DailyFeedPlan.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["date", "rabbit"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return DailyFeedPlanWriteSerializer
        return DailyFeedPlanSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rabbit_id = self.request.query_params.get("rabbit_id")
        if rabbit_id:
            queryset = queryset.filter(rabbit_id=rabbit_id)
        return queryset
