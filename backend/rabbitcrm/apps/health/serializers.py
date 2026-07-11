from rest_framework import serializers
from .models import HealthEvent, MedicalRecord, Quarantine


class HealthEventSerializer(serializers.ModelSerializer):
    """Сериализатор ветеринарного мероприятия"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    
    class Meta:
        model = HealthEvent
        fields = [
            "id", "rabbit", "rabbit_name", "rabbit_id", "event_type",
            "date", "description", "medication", "dosage", "vet_name",
            "risk_level", "is_urgent", "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Сериализатор медицинской карты"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = [
            "id", "rabbit", "rabbit_name", "rabbit_id", "blood_type",
            "allergies", "chronic_illnesses", "last_vaccination",
            "next_vaccination", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class QuarantineSerializer(serializers.ModelSerializer):
    """Сериализатор карантина"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    cage_address = serializers.CharField(source="location.full_address", read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Quarantine
        fields = [
            "id", "rabbit", "rabbit_name", "rabbit_id", "start_date",
            "end_date", "location", "cage_address", "reason", "observations",
            "is_completed", "is_active", "created_at"
        ]
        read_only_fields = ["id", "created_at", "is_active"]


class HealthEventWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи ветеринарного мероприятия"""
    
    class Meta:
        model = HealthEvent
        fields = [
            "id", "rabbit", "event_type", "date", "description",
            "medication", "dosage", "vet_name", "risk_level", "is_urgent", "notes"
        ]
        read_only_fields = ["id", "created_at"]


class QuarantineWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи карантина"""
    
    class Meta:
        model = Quarantine
        fields = [
            "id", "rabbit", "start_date", "end_date", "location",
            "reason", "observations", "is_completed"
        ]
        read_only_fields = ["id", "created_at"]
