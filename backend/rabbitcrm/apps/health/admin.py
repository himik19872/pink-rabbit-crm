from django.contrib import admin
from .models import HealthEvent, MedicalRecord, Quarantine


@admin.register(HealthEvent)
class HealthEventAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "event_type", "date", "is_urgent", "risk_level", "vet_name"]
    list_filter = ["event_type", "is_urgent", "risk_level", "date"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name", "description"]
    date_hierarchy = "date"
    fieldsets = (
        ("Информация", {
            "fields": ("rabbit", "event_type", "date")
        }),
        ("Описание", {
            "fields": ("description", "medication", "dosage", "vet_name")
        }),
        ("Оценка риска", {
            "fields": ("risk_level", "is_urgent")
        }),
        ("Примечания", {
            "fields": ("notes",)
        }),
    )


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "blood_type", "last_vaccination", "next_vaccination"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name"]
    fieldsets = (
        ("Основная информация", {
            "fields": ("rabbit",)
        }),
        ("Медицинские данные", {
            "fields": ("blood_type", "allergies", "chronic_illnesses")
        }),
        ("Прививки", {
            "fields": ("last_vaccination", "next_vaccination")
        }),
    )


@admin.register(Quarantine)
class QuarantineAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "start_date", "end_date", "is_completed"]
    list_filter = ["is_completed", "start_date", "end_date"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name", "reason"]
    date_hierarchy = "start_date"
    fieldsets = (
        ("Информация", {
            "fields": ("rabbit", "start_date", "end_date")
        }),
        ("Место", {
            "fields": ("location",)
        }),
        ("Причина и наблюдения", {
            "fields": ("reason", "observations")
        }),
        ("Статус", {
            "fields": ("is_completed",)
        }),
    )
