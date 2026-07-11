from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Rabbit, Weight, RabbitPhoto
from .serializers import (
    RabbitListSerializer, RabbitDetailSerializer, RabbitWriteSerializer,
    WeightSerializer, RabbitPhotoSerializer
)


class RabbitViewSet(viewsets.ModelViewSet):
    """ViewSet для кроликов"""
    
    queryset = Rabbit.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "gender", "breed", "mother", "father"]
    search_fields = ["rabbit_id", "name", "breed"]
    ordering_fields = ["birth_date", "created_at", "name"]
    
    def get_serializer_class(self):
        if self.action == "list":
            return RabbitListSerializer
        elif self.action == "retrieve":
            return RabbitDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return RabbitWriteSerializer
        return RabbitListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Показывать только активных кроликов по умолчанию
        if self.action == "list":
            queryset = queryset.filter(is_active=True)
        return queryset


class WeightViewSet(viewsets.ModelViewSet):
    """ViewSet для весов"""
    
    queryset = Weight.objects.all()
    serializer_class = WeightSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["rabbit"]
    ordering_fields = ["measured_at", "weight"]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Фильтрация по кролику из query params
        rabbit_id = self.request.query_params.get("rabbit_id")
        if rabbit_id:
            queryset = queryset.filter(rabbit_id=rabbit_id)
        return queryset


class RabbitPhotoViewSet(viewsets.ModelViewSet):
    """ViewSet для фото кроликов"""
    
    queryset = RabbitPhoto.objects.all()
    serializer_class = RabbitPhotoSerializer
    permission_classes = [IsAuthenticated]
