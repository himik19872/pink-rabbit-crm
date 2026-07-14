from rest_framework import serializers
from .models import FeedType, Feed, FeedStock, FeedDistribution, DailyFeedPlan, FeedPurchase


class FeedTypeSerializer(serializers.ModelSerializer):
    """Сериализатор типа корма"""
    
    class Meta:
        model = FeedType
        fields = ["id", "name", "category", "description", "nutritional_value", "created_at"]


class FeedSerializer(serializers.ModelSerializer):
    """Сериализатор корма"""
    
    feed_type_name = serializers.CharField(source="feed_type.name", read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Feed
        fields = [
            "id", "feed_type", "feed_type_name", "name", "brand",
            "batch_number", "expiry_date", "is_expired", "created_at"
        ]
        read_only_fields = ["id", "created_at", "is_expired"]


class FeedStockSerializer(serializers.ModelSerializer):
    """Сериализатор склада корма"""
    
    feed_name = serializers.CharField(source="feed.name", read_only=True)
    
    class Meta:
        model = FeedStock
        fields = [
            "id", "feed", "feed_name", "quantity", "unit_price",
            "total_value", "warehouse_location", "last_replenished"
        ]
        read_only_fields = ["id"]


class FeedDistributionSerializer(serializers.ModelSerializer):
    """Сериализатор раздачи корма"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    rabbit_id = serializers.CharField(source="rabbit.rabbit_id", read_only=True)
    feed_name = serializers.CharField(source="feed.name", read_only=True)
    
    class Meta:
        model = FeedDistribution
        fields = [
            "id", "rabbit", "rabbit_name", "rabbit_id", "feed", "feed_name",
            "quantity", "distribution_date", "time_of_day", "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class DailyFeedPlanSerializer(serializers.ModelSerializer):
    """Сериализатор плана кормления"""
    
    rabbit_name = serializers.CharField(source="rabbit.name", read_only=True)
    
    class Meta:
        model = DailyFeedPlan
        fields = [
            "id", "date", "rabbit", "rabbit_name", "total_quantity", "notes"
        ]
        read_only_fields = ["id"]


class FeedDistributionWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи раздачи корма"""
    
    class Meta:
        model = FeedDistribution
        fields = [
            "id", "rabbit", "feed", "quantity", "distribution_date",
            "time_of_day", "notes"
        ]
        read_only_fields = ["id", "created_at"]


class DailyFeedPlanWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для записи плана кормления"""
    
    class Meta:
        model = DailyFeedPlan
        fields = ["id", "date", "rabbit", "total_quantity", "notes"]
        read_only_fields = ["id"]

class FeedPurchaseSerializer(serializers.ModelSerializer):
    """Сериализатор прихода корма"""
    
    feed_name = serializers.CharField(source="feed.name", read_only=True)
    
    class Meta:
        model = FeedPurchase
        fields = [
            "id", "feed", "feed_name", "quantity_kg", "price_per_kg",
            "total_cost", "purchase_date", "supplier", "invoice_number",
            "batch_number", "expiry_date", "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]
