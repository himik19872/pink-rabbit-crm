from django.contrib import admin
from .models import BreedingPair, Mating, Pregnancy, Kindling, KindlingDetail, GenealogicalLine, RabbitLine


@admin.register(BreedingPair)
class BreedingPairAdmin(admin.ModelAdmin):
    list_display = ["__str__", "status", "started_at", "ended_at"]
    list_filter = ["status", "started_at"]
    search_fields = ["male__name", "female__name"]
    readonly_fields = ["created_at"]
    fieldsets = (
        ("Пара", {
            "fields": ("male", "female")
        }),
        ("Статус", {
            "fields": ("status", "started_at", "ended_at")
        }),
        ("Примечания", {
            "fields": ("notes",)
        }),
    )


@admin.register(Mating)
class MatingAdmin(admin.ModelAdmin):
    list_display = ["pair", "mating_date", "method", "success"]
    list_filter = ["method", "success", "mating_date"]
    search_fields = ["pair__male__name", "pair__female__name"]


@admin.register(Pregnancy)
class PregnancyAdmin(admin.ModelAdmin):
    list_display = ["female", "mating_date", "expected_due_date", "confirmed", "is_complete"]
    list_filter = ["confirmed", "is_complete", "expected_due_date"]
    search_fields = ["female__name", "female__rabbit_id"]
    date_hierarchy = "expected_due_date"
    fieldsets = (
        ("Информация", {
            "fields": ("female", "mating_date")
        }),
        ("Сроки", {
            "fields": ("expected_due_date", "actual_due_date")
        }),
        ("Диагностика", {
            "fields": ("confirmed", "ultrasound_date", "embryos_count")
        }),
        ("Статус", {
            "fields": ("is_complete",)
        }),
    )


@admin.register(Kindling)
class KindlingAdmin(admin.ModelAdmin):
    list_display = ["female", "kindling_date", "litter_size", "live_born", "stillborn", "survival_rate"]
    list_filter = ["kindling_date"]
    search_fields = ["female__name", "female__rabbit_id"]
    date_hierarchy = "kindling_date"
    readonly_fields = ["survival_rate"]
    fieldsets = (
        ("Информация", {
            "fields": ("female", "kindling_date")
        }),
        ("Помет", {
            "fields": ("litter_size", "live_born", "stillborn", "mummies")
        }),
        ("Место", {
            "fields": ("cage",)
        }),
        ("Примечания", {
            "fields": ("notes",)
        }),
    )


@admin.register(KindlingDetail)
class KindlingDetailAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "kindling", "birth_order", "gender", "birth_weight", "is_surviving"]
    list_filter = ["gender", "is_surviving", "birth_order"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name"]


@admin.register(GenealogicalLine)
class GenealogicalLineAdmin(admin.ModelAdmin):
    list_display = ["name", "line_type", "founder", "established_date", "is_active"]
    list_filter = ["line_type", "is_active", "established_date"]
    search_fields = ["name", "founder__name", "founder__rabbit_id"]
    fieldsets = (
        ("Основная информация", {
            "fields": ("name", "line_type", "description")
        }),
        ("Основатель", {
            "fields": ("founder", "established_date")
        }),
        ("Статус", {
            "fields": ("is_active",)
        }),
    )


@admin.register(RabbitLine)
class RabbitLineAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "line", "generation", "joined_at"]
    list_filter = ["line", "generation", "joined_at"]
    search_fields = ["rabbit__name", "rabbit__rabbit_id", "line__name"]
