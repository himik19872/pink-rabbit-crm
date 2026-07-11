from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AnalyticsReport
from .serializers import AnalyticsReportSerializer
from .models import (
    BreedingAnalytics, HealthAnalytics, FeedingAnalytics, ProductionAnalytics
)


class AnalyticsViewSet(viewsets.ViewSet):
    """ViewSet для аналитики"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def breeding(self, request):
        """Аналитика разведения"""
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")
        
        if not from_date or not to_date:
            return Response(
                {"error": "from and to dates required"},
                status=400
            )
        
        stats = BreedingAnalytics.get_breeding_stats(from_date, to_date)
        return Response(stats)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def health(self, request):
        """Аналитика здоровья"""
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")
        
        if not from_date or not to_date:
            return Response(
                {"error": "from and to dates required"},
                status=400
            )
        
        stats = HealthAnalytics.get_health_stats(from_date, to_date)
        return Response(stats)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def feeding(self, request):
        """Аналитика кормления"""
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")
        
        if not from_date or not to_date:
            return Response(
                {"error": "from and to dates required"},
                status=400
            )
        
        stats = FeedingAnalytics.get_feeding_stats(from_date, to_date)
        return Response(stats)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def production(self, request):
        """Ключевые показатели производства"""
        metrics = ProductionAnalytics.get_production_metrics()
        return Response(metrics)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def rabbit_pedigree(self, request):
        """Родословная конкретного кролика"""
        rabbit_id = request.query_params.get("rabbit_id")
        
        if not rabbit_id:
            return Response(
                {"error": "rabbit_id required"},
                status=400
            )
        
        pedigree = BreedingAnalytics.get_pedigree_analysis(rabbit_id)
        if not pedigree:
            return Response(
                {"error": "Rabbit not found"},
                status=404
            )
        return Response(pedigree)
