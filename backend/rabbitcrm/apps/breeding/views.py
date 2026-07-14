from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import BreedingPair, Mating, Pregnancy, Kindling, KindlingDetail, GenealogicalLine, RabbitLine
from .serializers import (
    BreedingPairSerializer, MatingSerializer, PregnancySerializer,
    KindlingSerializer, KindlingDetailSerializer,
    BreedingPairWriteSerializer, KindlingWriteSerializer,
    GenealogicalLineSerializer, RabbitLineSerializer,
)


class BreedingPairViewSet(viewsets.ModelViewSet):
    """ViewSet для племенных пар — CRUD"""
    
    queryset = BreedingPair.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "male", "female"]
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BreedingPairWriteSerializer
        return BreedingPairSerializer


class MatingViewSet(viewsets.ModelViewSet):
    """ViewSet для спариваний — при успехе авто-создаёт беременность"""
    
    queryset = Mating.objects.all()
    serializer_class = MatingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["pair", "mating_date", "success"]

    def perform_create(self, serializer):
        mating = serializer.save()
        # При успешном спаривании — авто-создаём беременность
        if mating.success and mating.pair:
            female = mating.pair.female
            male = mating.pair.male
            # Не создаём дубликат если уже есть незавершённая беременность
            if not Pregnancy.objects.filter(female=female, is_complete=False).exists():
                Pregnancy.objects.create(
                    female=female,
                    male=male,
                    mating_date=mating.mating_date,
                    confirmed=False,
                )


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
    """ViewSet для окотов — CRUD + авто-создание крольчат"""
    
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

    def perform_create(self, serializer):
        kindling = serializer.save()
        # Ищем отца: последняя завершённая или незавершённая беременность этой самки
        pregnancy = Pregnancy.objects.filter(
            female=kindling.female, is_complete=False
        ).order_by("-mating_date").first()
        if not pregnancy:
            pregnancy = Pregnancy.objects.filter(
                female=kindling.female
            ).order_by("-mating_date").first()
        father = pregnancy.male if pregnancy else None

        # Авто-создаём крольчат в статусе YOUNG
        from rabbitcrm.apps.rabbits.models import Rabbit
        for i in range(kindling.live_born):
            Rabbit.objects.create(
                name=f"{kindling.female.name or 'Самка'}-{kindling.kindling_date.strftime('%d%m')}-{i+1}",
                gender="F" if i % 2 == 0 else "M",
                birth_date=kindling.kindling_date,
                status="YOUNG",
                breed=kindling.female.breed or "",
                mother=kindling.female,
                father=father,
                notes=f"Окот #{kindling.id} от ♀{kindling.female.name} × ♂{father.name if father else '?'}",
            )
        # Завершаем беременность
        Pregnancy.objects.filter(
            female=kindling.female, is_complete=False,
        ).update(is_complete=True, actual_due_date=kindling.kindling_date)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def promote_young(self, request):
        """Перевод молодняка старше 30 дней в мясной/племенной статус"""
        from rabbitcrm.apps.rabbits.models import Rabbit
        from datetime import timedelta
        cutoff = timezone.now().date() - timedelta(days=30)
        promoted = Rabbit.objects.filter(status="YOUNG", birth_date__lte=cutoff)
        count = promoted.count()
        # По умолчанию — мясные; можно указать ?status=BREEDING
        new_status = request.query_params.get("status", "MEAT")
        promoted.update(status=new_status)
        return Response({"promoted": count, "new_status": new_status})


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
