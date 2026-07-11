from django.contrib import admin
from .models import AnalyticsReport


@admin.register(AnalyticsReport)
class AnalyticsReportAdmin(admin.ModelAdmin):
    list_display = ["report_type", "period_start", "period_end", "generated_at", "generated_by"]
    list_filter = ["report_type", "generated_at", "period_start", "period_end"]
    search_fields = ["generated_by", "data"]
    date_hierarchy = "generated_at"
    readonly_fields = ["data", "generated_at"]
