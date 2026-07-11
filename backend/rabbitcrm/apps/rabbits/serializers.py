from rest_framework import serializers
from .models import Rabbit, Weight, RabbitPhoto
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
    father_name = serializers.CharField(source="father.name", read_only=True)
    age_months = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Rabbit
        fields = [
            "id", "rabbit_id", "name", "gender", "birth_date", "age_months",
            "status", "breed", "mother", "father", "mother_name", "father_name",
            "current_cage", "is_breeding_stock", "created_at"
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
