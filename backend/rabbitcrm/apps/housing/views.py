from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Building, Row, Shelf, Cage, CageMove, WaterConsumption
from .serializers import (
    BuildingSerializer, RowSerializer, ShelfSerializer,
    CageSerializer, CageMoveSerializer, CageAssignmentSerializer,
    WaterConsumptionSerializer,
)


class BuildingViewSet(viewsets.ModelViewSet):
    """ViewSet для помещений"""
    
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [IsAuthenticated]


class RowViewSet(viewsets.ModelViewSet):
    """ViewSet для рядов"""
    
    queryset = Row.objects.all()
    serializer_class = RowSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["building"]


class ShelfViewSet(viewsets.ModelViewSet):
    """ViewSet для ярусов"""
    
    queryset = Shelf.objects.all()
    serializer_class = ShelfSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["row"]


class CageViewSet(viewsets.ModelViewSet):
    """ViewSet для клеток"""
    
    queryset = Cage.objects.all()
    serializer_class = CageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["shelf", "is_active", "current_rabbit"]
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def scan(self, request):
        """Сканирование QR-кода клетки → профиль кролика (для мобильного приложения)"""
        cage_id = request.query_params.get("cage_id")
        if not cage_id:
            return Response({"error": "cage_id required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cage = Cage.objects.get(id=cage_id)
            serializer = self.get_serializer(cage)
            return Response(serializer.data)
        except Cage.DoesNotExist:
            return Response({"error": "Cage not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        """Назначить кролика клетке"""
        cage = self.get_object()
        serializer = CageAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            rabbit_id = serializer.validated_data.get("rabbit_id")
            reason = serializer.validated_data.get("reason", "")
            
            try:
                from rabbitcrm.apps.rabbits.models import Rabbit
                rabbit = Rabbit.objects.get(id=rabbit_id)
                cage.assign_rabbit(rabbit)
                
                # Записать перемещение
                CageMove.objects.create(
                    rabbit=rabbit,
                    from_cage=cage,  # Текущая клетка будет обновлена в истории
                    to_cage=cage,
                    moved_by=request.user.username if request.user.is_authenticated else "system",
                    reason=reason
                )
                
                return Response({"status": "rabbit_assigned", "rabbit_id": rabbit_id})
            except Rabbit.DoesNotExist:
                return Response(
                    {"error": "Rabbit not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def clear(self, request, pk=None):
        """Освободить клетку"""
        cage = self.get_object()
        if cage.current_rabbit:
            CageMove.objects.create(
                rabbit=cage.current_rabbit,
                from_cage=cage,
                to_cage=None,
                moved_by=request.user.username if request.user.is_authenticated else "system",
                reason="Освобождение клетки"
            )
            cage.clear_rabbit()
            return Response({"status": "cage_cleared"})
        return Response({"status": "cage_was_empty"})


class CageMoveViewSet(viewsets.ModelViewSet):
    """ViewSet для перемещений клеток"""
    
    queryset = CageMove.objects.all()
    serializer_class = CageMoveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["rabbit", "from_cage", "to_cage"]


class WaterConsumptionViewSet(viewsets.ModelViewSet):
    """ViewSet для учёта расхода воды"""

    queryset = WaterConsumption.objects.all()
    serializer_class = WaterConsumptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["cage", "date"]
