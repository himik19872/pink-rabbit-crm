from rest_framework import serializers
from .models import AnalyticsReport


class AnalyticsReportSerializer(serializers.ModelSerializer):
    """Сериализатор аналитического отчета"""
    
    class Meta:
        model = AnalyticsReport
        fields = ["id", "report_type", "period_start", "period_end", "data", "generated_at", "generated_by"]
        read_only_fields = ["id", "generated_at"]
