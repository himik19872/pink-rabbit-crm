from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import HealthEvent, MedicalRecord, Quarantine
from .serializers import (
    HealthEventSerializer, MedicalRecordSerializer, QuarantineSerializer,
    HealthEventWriteSerializer, QuarantineWriteSerializer
)


class HealthEventViewSet(viewsets.ModelViewSet):
    """ViewSet для ветеринарных мероприятий"""
    
    queryset = HealthEvent.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["rabbit", "event_type", "is_urgent", "date"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return HealthEventWriteSerializer
        return HealthEventSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rabbit_id = self.request.query_params.get("rabbit_id")
        if rabbit_id:
            queryset = queryset.filter(rabbit_id=rabbit_id)
        return queryset
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def urgent(self, request):
        """Получить срочные мероприятия"""
        queryset = self.filter_queryset(self.get_queryset().filter(is_urgent=True))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def rabbit_history(self, request):
        """Получить историю мероприятия по кролику"""
        rabbit_id = request.query_params.get("rabbit_id")
        if not rabbit_id:
            return Response(
                {"error": "rabbit_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.filter_queryset(
            self.get_queryset().filter(rabbit_id=rabbit_id).order_by("-date")
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    """ViewSet для медицинских карт"""
    
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rabbit_id = self.request.query_params.get("rabbit_id")
        if rabbit_id:
            queryset = queryset.filter(rabbit_id=rabbit_id)
        return queryset


class QuarantineViewSet(viewsets.ModelViewSet):
    """ViewSet для карантина"""
    
    queryset = Quarantine.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["rabbit", "is_completed", "is_active"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return QuarantineWriteSerializer
        return QuarantineSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rabbit_id = self.request.query_params.get("rabbit_id")
        if rabbit_id:
            queryset = queryset.filter(rabbit_id=rabbit_id)
        return queryset
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def active(self, request):
        """Получить активные карантины"""
        from django.utils import timezone
        queryset = self.filter_queryset(
            self.get_queryset().filter(
                is_completed=False,
                start_date__lte=timezone.now().date(),
                end_date__gte=timezone.now().date(),
            )
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
