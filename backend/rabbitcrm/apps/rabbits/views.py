from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter, CharFilter
from .models import Rabbit, Weight, RabbitPhoto, Slaughter
from .serializers import (
    RabbitListSerializer, RabbitDetailSerializer, RabbitWriteSerializer,
    WeightSerializer, RabbitPhotoSerializer, SlaughterSerializer
)


class RabbitFilter(FilterSet):
    """Фильтры для кроликов"""
    age_min = NumberFilter(method="filter_age_min", label="Мин. возраст (мес)")
    age_max = NumberFilter(method="filter_age_max", label="Макс. возраст (мес)")

    class Meta:
        model = Rabbit
        fields = ["status", "gender", "breed", "mother", "father"]

    def filter_age_min(self, queryset, name, value):
        """Фильтр: кролики старше N месяцев"""
        import datetime
        from django.utils import timezone
        cutoff = timezone.now().date() - datetime.timedelta(days=int(float(value) * 30.44))
        return queryset.filter(birth_date__lte=cutoff)

    def filter_age_max(self, queryset, name, value):
        """Фильтр: кролики младше N месяцев"""
        import datetime
        from django.utils import timezone
        cutoff = timezone.now().date() - datetime.timedelta(days=int(float(value) * 30.44))
        return queryset.filter(birth_date__gte=cutoff)


class RabbitViewSet(viewsets.ModelViewSet):
    """ViewSet для кроликов"""

    queryset = Rabbit.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = RabbitFilter
    search_fields = ["rabbit_id", "name", "breed"]
    ordering_fields = ["birth_date", "created_at", "name", "age_months"]
    ordering = ["-birth_date"]

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
        if self.action == "list":
            queryset = queryset.filter(is_active=True)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Мягкое удаление с проверкой связей"""
        instance = self.get_object()
        # Проверяем, используется ли кролик в племенных парах
        from rabbitcrm.apps.breeding.models import BreedingPair
        pairs = BreedingPair.objects.filter(
            models.Q(male=instance) | models.Q(female=instance)
        ).filter(status__in=["ACTIVE", "INACTIVE"])
        if pairs.exists():
            pair_list = ", ".join([str(p) for p in pairs[:5]])
            return Response(
                {"detail": f"Невозможно удалить: кролик состоит в племенных парах: {pair_list}. "
                           f"Сначала деактивируйте пары или смените статус кролика."},
                status=status.HTTP_409_CONFLICT
            )
        # Проверяем, находится ли кролик в клетке
        cage = instance.current_cage.first()
        if cage:
            cage.clear_rabbit()
        # Мягкое удаление
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class SlaughterViewSet(viewsets.ModelViewSet):
    """ViewSet для учёта забоя"""

    queryset = Slaughter.objects.all()
    serializer_class = SlaughterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["rabbit", "slaughter_date"]
    ordering_fields = ["slaughter_date", "live_weight", "carcass_weight"]

    def perform_create(self, serializer):
        slaughter = serializer.save()
        # При забое переводим кролика в статус SOLD (мясо)
        rabbit = slaughter.rabbit
        rabbit.status = "SOLD"
        rabbit.save()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Статистика забоев"""
        from django.db.models import Avg, Sum, Count
        qs = Slaughter.objects.all()
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")
        if from_date and to_date:
            qs = qs.filter(slaughter_date__gte=from_date, slaughter_date__lte=to_date)

        agg = qs.aggregate(
            total_count=Count("id"),
            total_live=Sum("live_weight"),
            total_carcass=Sum("carcass_weight"),
            avg_live=Avg("live_weight"),
            avg_carcass=Avg("carcass_weight"),
        )
        # Убойный выход
        total_live = float(agg["total_live"] or 0)
        total_carcass = float(agg["total_carcass"] or 0)
        dressing = round((total_carcass / total_live * 100), 1) if total_live > 0 else 0

        return Response({
            "total_count": agg["total_count"] or 0,
            "total_live_kg": round(total_live / 1000, 2),
            "total_carcass_kg": round(total_carcass / 1000, 2),
            "avg_live_g": round(float(agg["avg_live"] or 0), 1),
            "avg_carcass_g": round(float(agg["avg_carcass"] or 0), 1),
            "dressing_percentage": dressing,
            "latest": SlaughterSerializer(qs.order_by("-slaughter_date")[:10], many=True).data,
        })
