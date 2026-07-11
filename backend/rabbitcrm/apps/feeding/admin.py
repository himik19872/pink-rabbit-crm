from django.contrib import admin
from .models import FeedType, Feed, FeedStock, FeedDistribution, DailyFeedPlan


@admin.register(FeedType)
class FeedTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "description"]
    list_filter = ["category"]
    search_fields = ["name"]


@admin.register(Feed)
class FeedAdmin(admin.ModelAdmin):
    list_display = ["name", "feed_type", "brand", "batch_number", "expiry_date", "is_expired"]
    list_filter = ["feed_type", "expiry_date"]
    search_fields = ["name", "brand", "batch_number"]
    readonly_fields = ["is_expired"]


@admin.register(FeedStock)
class FeedStockAdmin(admin.ModelAdmin):
    list_display = ["feed", "quantity", "unit_price", "total_value", "warehouse_location", "last_replenished"]
    list_filter = ["feed__feed_type", "last_replenished"]
    search_fields = ["feed__name", "warehouse_location"]


@admin.register(FeedDistribution)
class FeedDistributionAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "feed", "quantity", "distribution_date", "time_of_day"]
    list_filter = ["distribution_date", "time_of_day", "feed__feed_type"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name", "feed__name"]
    date_hierarchy = "distribution_date"


@admin.register(DailyFeedPlan)
class DailyFeedPlanAdmin(admin.ModelAdmin):
    list_display = ["date", "rabbit", "total_quantity", "created_at"]
    list_filter = ["date"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name"]
    date_hierarchy = "date"
