from rest_framework import serializers
from .models import Rabbit, Weight, RabbitPhoto, Slaughter
from rabbitcrm.apps.housing.models import Cage


class WeightSerializer(serializers.ModelSerializer):
    """Сериализатор веса"""
    
    class Meta:
        model = Weight
        fields = ["id", "rabbit", "weight", "measured_at", "method", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class RabbitPhotoSerializer(serializers.ModelSerializer):
    """Сериализатор фото кролика"""
    
    class Meta:
        model = RabbitPhoto
        fields = ["id", "rabbit", "photo", "caption", "is_primary", "created_at"]
        read_only_fields = ["id", "created_at"]


class RabbitListSerializer(serializers.ModelSerializer):
    """Сериализатор списка кроликов"""
    
    current_cage = serializers.CharField(source="current_cage.full_address", read_only=True)
    mother_name = serializers.CharField(source="mother.name", read_only=True)
    mother_rabbit_id = serializers.CharField(source="mother.rabbit_id", read_only=True)
    father_name = serializers.CharField(source="father.name", read_only=True)
    father_rabbit_id = serializers.CharField(source="father.rabbit_id", read_only=True)
    age_months = serializers.IntegerField(read_only=True)
    offspring_count = serializers.IntegerField(source="get_offspring_count", read_only=True)
    total_offspring = serializers.IntegerField(source="get_total_offspring_count", read_only=True)
    
    class Meta:
        model = Rabbit
        fields = [
            "id", "rabbit_id", "name", "gender", "birth_date", "age_months",
            "status", "breed", "mother", "father", "mother_name", "mother_rabbit_id",
            "father_name", "father_rabbit_id",
            "current_cage", "is_breeding_stock", "offspring_count", "total_offspring",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class RabbitDetailSerializer(serializers.ModelSerializer):
    """Сериализатор детальной информации о кролике"""
    
    current_cage = serializers.CharField(source="current_cage.full_address", read_only=True)
    mother = serializers.StringRelatedField()
    father = serializers.StringRelatedField()
    weights = WeightSerializer(many=True, read_only=True)
    photos = RabbitPhotoSerializer(many=True, read_only=True)
    health_events = serializers.StringRelatedField(many=True, read_only=True)
    feed_distributions = serializers.StringRelatedField(many=True, read_only=True)
    age_months = serializers.IntegerField(read_only=True)
    offspring_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Rabbit
        fields = [
            "id", "rabbit_id", "name", "gender", "birth_date", "age_months",
            "status", "breed", "mother", "father", "notes",
            "current_cage", "weights", "photos", "health_events",
            "feed_distributions", "offspring_count", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class RabbitWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи кролика"""
    
    class Meta:
        model = Rabbit
        fields = [
            "id", "rabbit_id", "name", "gender", "birth_date", "status",
            "breed", "mother", "father", "notes", "created_at"
        ]
        read_only_fields = ["id", "rabbit_id", "created_at"]


class SlaughterSerializer(serializers.ModelSerializer):
    """Сериализатор забоя"""

    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    dressing_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Slaughter
        fields = [
            "id", "rabbit", "rabbit_name", "rabbit_id",
            "slaughter_date", "live_weight", "carcass_weight",
            "dressing_percentage", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
