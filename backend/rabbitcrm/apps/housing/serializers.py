from rest_framework import serializers
from .models import Building, Row, Shelf, Cage, CageMove, WaterConsumption


class BuildingSerializer(serializers.ModelSerializer):
    """Сериализатор помещения"""
    
    class Meta:
        model = Building
        fields = ["id", "name", "address", "description", "created_at"]


class RowSerializer(serializers.ModelSerializer):
    """Сериализатор ряда"""
    
    building_name = serializers.CharField(source="building.name", read_only=True)
    
    class Meta:
        model = Row
        fields = ["id", "building", "building_name", "number", "description"]


class ShelfSerializer(serializers.ModelSerializer):
    """Сериализатор яруса"""
    
    row_address = serializers.CharField(source="row.full_address", read_only=True)
    
    class Meta:
        model = Shelf
        fields = ["id", "row", "row_address", "number", "description"]


class CageSerializer(serializers.ModelSerializer):
    """Сериализатор клетки"""
    
    shelf_address = serializers.CharField(source="shelf.full_address", read_only=True)
    current_rabbit_info = serializers.StringRelatedField(source="current_rabbit", read_only=True)
    address_qr = serializers.CharField(read_only=True)
    qr_code_url = serializers.ImageField(source="qr_code", read_only=True)
    rabbit_info = serializers.JSONField(read_only=True)
    
    class Meta:
        model = Cage
        fields = [
            "id", "shelf", "shelf_address", "number", "capacity",
            "current_rabbit", "current_rabbit_info", "last_cleaned",
            "last_disinfected", "is_active", "address_qr", "qr_code_url",
            "rabbit_info", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class CageMoveSerializer(serializers.ModelSerializer):
    """Сериализатор перемещения клетки"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    from_cage_address = serializers.CharField(source="from_cage.full_address", read_only=True)
    to_cage_address = serializers.CharField(source="to_cage.full_address", read_only=True)
    
    class Meta:
        model = CageMove
        fields = [
            "id", "rabbit", "rabbit_name", "from_cage", "from_cage_address",
            "to_cage", "to_cage_address", "moved_at", "moved_by", "reason"
        ]
        read_only_fields = ["id", "moved_at"]


class CageAssignmentSerializer(serializers.Serializer):
    """Сериализатор назначения кролика клетке"""
    
    rabbit_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True)


class WaterConsumptionSerializer(serializers.ModelSerializer):
    """Сериализатор расхода воды"""

    cage_address = serializers.CharField(source="cage.full_address", read_only=True)

    class Meta:
        model = WaterConsumption
        fields = ["id", "cage", "cage_address", "date", "amount_ml", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]
