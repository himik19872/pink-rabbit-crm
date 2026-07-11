from rest_framework import serializers
from .models import BreedingPair, Mating, Pregnancy, Kindling, KindlingDetail, GenealogicalLine, RabbitLine


class BreedingPairSerializer(serializers.ModelSerializer):
    """Сериализатор племенной пары"""
    
    male_name = serializers.CharField(source="male.name", read_only=True)
    female_name = serializers.CharField(source="female.name", read_only=True)
    
    class Meta:
        model = BreedingPair
        fields = [
            "id", "male", "male_name", "female", "female_name",
            "status", "started_at", "ended_at", "notes"
        ]
        read_only_fields = ["id"]


class MatingSerializer(serializers.ModelSerializer):
    """Сериализатор спаривания"""
    
    pair_info = serializers.CharField(source="pair.__str__", read_only=True)
    
    class Meta:
        model = Mating
        fields = ["id", "pair", "pair_info", "mating_date", "method", "success", "notes"]
        read_only_fields = ["id"]


class PregnancySerializer(serializers.ModelSerializer):
    """Сериализатор беременности"""
    
    female_name = serializers.CharField(source="female.name", read_only=True)
    female_id = serializers.CharField(source="female.rabbit_id", read_only=True)
    
    class Meta:
        model = Pregnancy
        fields = [
            "id", "female", "female_name", "female_id", "mating_date",
            "expected_due_date", "actual_due_date", "confirmed", "ultrasound_date",
            "embryos_count", "is_complete", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class KindlingSerializer(serializers.ModelSerializer):
    """Сериализатор окота"""
    
    female_name = serializers.CharField(source="female.name", read_only=True)
    female_id = serializers.CharField(source="female.rabbit_id", read_only=True)
    cage_address = serializers.CharField(source="cage.full_address", read_only=True)
    survival_rate = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    
    class Meta:
        model = Kindling
        fields = [
            "id", "female", "female_name", "female_id", "kindling_date",
            "litter_size", "live_born", "stillborn", "mummies", "cage",
            "cage_address", "survival_rate", "notes"
        ]
        read_only_fields = ["id", "survival_rate"]


class KindlingDetailSerializer(serializers.ModelSerializer):
    """Сериализатор крольчонка"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    
    class Meta:
        model = KindlingDetail
        fields = [
            "id", "kindling", "rabbit", "rabbit_name", "rabbit_id",
            "birth_order", "gender", "birth_weight", "is_surviving", "notes"
        ]
        read_only_fields = ["id"]


class BreedingPairWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи племенной пары"""
    
    class Meta:
        model = BreedingPair
        fields = ["id", "male", "female", "status", "started_at", "ended_at", "notes"]
        read_only_fields = ["id"]


class KindlingWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи окота"""
    
    class Meta:
        model = Kindling
        fields = [
            "id", "female", "kindling_date", "litter_size", "live_born",
            "stillborn", "mummies", "cage", "notes"
        ]
        read_only_fields = ["id"]


class GenealogicalLineSerializer(serializers.ModelSerializer):
    """Сериализатор генеалогической линии"""

    founder_name = serializers.CharField(source="founder.name", read_only=True)
    founder_rabbit_id = serializers.CharField(source="founder.rabbit_id", read_only=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = GenealogicalLine
        fields = [
            "id", "name", "line_type", "founder", "founder_name",
            "founder_rabbit_id", "description", "established_date",
            "is_active", "member_count", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RabbitLineSerializer(serializers.ModelSerializer):
    """Сериализатор привязки кролика к линии"""

    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    line_name = serializers.CharField(source="line.name", read_only=True)

    class Meta:
        model = RabbitLine
        fields = [
            "id", "rabbit", "rabbit_name", "rabbit_id", "line",
            "line_name", "generation", "joined_at"
        ]
        read_only_fields = ["id"]
