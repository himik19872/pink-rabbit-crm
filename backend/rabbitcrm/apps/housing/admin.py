from django.contrib import admin
from .models import Building, Row, Shelf, Cage, CageMove, WaterConsumption


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ["name", "address", "created_at"]
    search_fields = ["name", "address"]


@admin.register(Row)
class RowAdmin(admin.ModelAdmin):
    list_display = ["building", "number", "description"]
    list_filter = ["building"]
    search_fields = ["building__name", "description"]


@admin.register(Shelf)
class ShelfAdmin(admin.ModelAdmin):
    list_display = ["row", "number", "description"]
    list_filter = ["row__building"]
    search_fields = ["row__building__name", "description"]


@admin.register(Cage)
class CageAdmin(admin.ModelAdmin):
    list_display = ["shelf", "number", "capacity", "current_rabbit", "is_active", "last_cleaned"]
    list_filter = ["is_active", "shelf__row__building"]
    search_fields = ["shelf__row__building__name", "number"]
    readonly_fields = ["created_at", "qr_code"]
    fieldsets = (
        ("Расположение", {
            "fields": ("shelf", "number", "capacity")
        }),
        ("Текущее состояние", {
            "fields": ("current_rabbit", "is_active")
        }),
        ("Уборка", {
            "fields": ("last_cleaned", "last_disinfected")
        }),
        ("QR-код", {
            "fields": ("qr_code",)
        }),
    )


@admin.register(CageMove)
class CageMoveAdmin(admin.ModelAdmin):
    list_display = ["rabbit", "from_cage", "to_cage", "moved_at", "moved_by"]
    list_filter = ["moved_at"]
    search_fields = ["rabbit__rabbit_id", "rabbit__name", "moved_by"]
    date_hierarchy = "moved_at"


@admin.register(WaterConsumption)
class WaterConsumptionAdmin(admin.ModelAdmin):
    list_display = ["cage", "date", "amount_ml"]
    list_filter = ["date", "cage__shelf__row__building"]
    search_fields = ["cage__shelf__row__building__name"]
    date_hierarchy = "date"
