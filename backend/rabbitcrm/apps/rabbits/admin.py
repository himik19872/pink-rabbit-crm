from django.contrib import admin
from .models import Rabbit, Weight, RabbitPhoto


@admin.register(Rabbit)
class RabbitAdmin(admin.ModelAdmin):
    list_display = ["rabbit_id", "name", "gender", "birth_date", "status", "breed", "created_at"]
    list_filter = ["status", "gender", "breed", "birth_date", "created_at"]
    search_fields = ["rabbit_id", "name", "breed"]
    date_hierarchy = "birth_date"
    ordering = ["-birth_date"]
    readonly_fields = ["rabbit_id", "created_at"]
    fieldsets = (
        ("Основная информация", {
            "fields": ("rabbit_id", "name", "gender", "birth_date", "status", "breed")
        }),
        ("Родословная", {
            "fields": ("mother", "father")
        }),
        ("Примечания", {
            "fields": ("notes",)
        }),
    )


@admin.register(Weight)
class WeightAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "weight", "measured_at", "method", "created_at"]
    list_filter = ["method", "measured_at"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name"]
    date_hierarchy = "measured_at"
    ordering = ["-measured_at"]


@admin.register(RabbitPhoto)
class RabbitPhotoAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "caption", "is_primary", "created_at"]
    list_filter = ["is_primary", "created_at"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name", "caption"]
