from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import BreedingPair, Mating, Pregnancy, Kindling, KindlingDetail, GenealogicalLine, RabbitLine
from .serializers import (
    BreedingPairSerializer, MatingSerializer, PregnancySerializer,
    KindlingSerializer, KindlingDetailSerializer,
    BreedingPairWriteSerializer, KindlingWriteSerializer,
    GenealogicalLineSerializer, RabbitLineSerializer,
)


class BreedingPairViewSet(viewsets.ModelViewSet):
    """ViewSet для племенных пар"""
    
    queryset = BreedingPair.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "male", "female"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BreedingPairWriteSerializer
        return BreedingPairSerializer


class MatingViewSet(viewsets.ModelViewSet):
    """ViewSet для спариваний"""
    
    queryset = Mating.objects.all()
    serializer_class = MatingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["pair", "mating_date", "success"]


class PregnancyViewSet(viewsets.ModelViewSet):
    """ViewSet для беременностей"""
    
    queryset = Pregnancy.objects.all()
    serializer_class = PregnancySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["female", "confirmed", "is_complete"]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        female_id = self.request.query_params.get("female_id")
        if female_id:
            queryset = queryset.filter(female_id=female_id)
        return queryset


class KindlingViewSet(viewsets.ModelViewSet):
    """ViewSet для окотов"""
    
    queryset = Kindling.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["female", "kindling_date"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return KindlingWriteSerializer
        return KindlingSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        female_id = self.request.query_params.get("female_id")
        if female_id:
            queryset = queryset.filter(female_id=female_id)
        return queryset


class KindlingDetailViewSet(viewsets.ModelViewSet):
    """ViewSet для деталей окота"""
    
    queryset = KindlingDetail.objects.all()
    serializer_class = KindlingDetailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["kindling", "gender", "is_surviving"]


class GenealogicalLineViewSet(viewsets.ModelViewSet):
    """ViewSet для генеалогических линий"""

    queryset = GenealogicalLine.objects.all()
    serializer_class = GenealogicalLineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["line_type", "is_active"]


class RabbitLineViewSet(viewsets.ModelViewSet):
    """ViewSet для привязки кроликов к линиям"""

    queryset = RabbitLine.objects.all()
    serializer_class = RabbitLineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["rabbit", "line", "generation"]
