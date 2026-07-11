from django.db import models
from django.db.models import Avg, Count, Sum
from django.utils import timezone


class AnalyticsReport(models.Model):
    """Отчет по аналитике"""
    
    REPORT_TYPE_CHOICES = [
        ("BREEDING", "Разведение"),
        ("HEALTH", "Здоровье"),
        ("FEEDING", "Кормление"),
        ("PRODUCTION", "Производство"),
        ("FINANCE", "Финансы"),
    ]
    
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES, verbose_name="Тип отчета")
    period_start = models.DateField(verbose_name="Начало периода")
    period_end = models.DateField(verbose_name="Конец периода")
    data = models.JSONField(verbose_name="Данные")
    generated_at = models.DateTimeField(auto_now_add=True, verbose_name="Сгенерировано")
    generated_by = models.CharField(max_length=100, verbose_name="Сгенерировал")
    
    class Meta:
        verbose_name = "Аналитический отчет"
        verbose_name_plural = "Аналитические отчеты"
        ordering = ["-generated_at"]
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.period_start} to {self.period_end}"


class BreedingAnalytics:
    """Аналитика разведения"""
    
    @staticmethod
    def get_breeding_stats(start_date, end_date):
        """Статистика разведения за период"""
        from rabbitcrm.apps.rabbits.models import Rabbit
        from rabbitcrm.apps.breeding.models import Kindling
        
        stats = {
            "total_matings": 0,
            "total_kindlings": 0,
            "total_offspring": 0,
            "total_surviving": 0,
            "avg_litter_size": 0,
            "avg_survival_rate": 0,
            "top_breeders": [],
        }
        
        # Количество окотов
        kindlings = Kindling.objects.filter(
            kindling_date__range=[start_date, end_date]
        )
        
        stats["total_kindlings"] = kindlings.count()
        stats["total_offspring"] = kindlings.aggregate(Sum("litter_size"))["litter_size__sum"] or 0
        stats["total_surviving"] = kindlings.aggregate(Sum("live_born"))["live_born__sum"] or 0
        
        if stats["total_kindlings"] > 0:
            stats["avg_litter_size"] = round(stats["total_offspring"] / stats["total_kindlings"], 2)
        
        if stats["total_offspring"] > 0:
            stats["avg_survival_rate"] = round(
                (stats["total_surviving"] / stats["total_offspring"]) * 100, 1
            )
        
        # Топ-10 лучших матерей
        stats["top_breeders"] = list(
            Rabbit.objects.filter(
                gender="F",
                kindlings__kindling_date__range=[start_date, end_date]
            )
            .annotate(
                total_offspring=Sum("kindlings__litter_size"),
                total_surviving=Sum("kindlings__live_born"),
                avg_litter_size=Avg("kindlings__litter_size"),
            )
            .order_by("-total_offspring")[:10]
        )
        
        return stats
    
    @staticmethod
    def get_pedigree_analysis(rabbit_id):
        """Анализ родословной"""
        from rabbitcrm.apps.rabbits.models import Rabbit
        
        try:
            rabbit = Rabbit.objects.get(id=rabbit_id)
        except Rabbit.DoesNotExist:
            return None
        
        pedigree = rabbit.get_full_pedigree(depth=4)
        return pedigree


class HealthAnalytics:
    """Аналитика здоровья"""
    
    @staticmethod
    def get_health_stats(start_date, end_date):
        """Статистика здоровья за период"""
        from rabbitcrm.apps.health.models import HealthEvent, Quarantine
        
        stats = {
            "total_events": 0,
            "by_type": {},
            "urgent_events": 0,
            "active_quarantines": 0,
            "medication_usage": [],
        }
        
        events = HealthEvent.objects.filter(date__range=[start_date, end_date])
        stats["total_events"] = events.count()
        stats["urgent_events"] = events.filter(is_urgent=True).count()
        
        # По типам мероприятий
        type_counts = events.values("event_type").annotate(count=Count("id"))
        stats["by_type"] = {item["event_type"]: item["count"] for item in type_counts}
        
        # Активные карантины
        stats["active_quarantines"] = Quarantine.objects.filter(
            is_completed=False,
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date(),
        ).count()
        
        return stats


class FeedingAnalytics:
    """Аналитика кормления"""
    
    @staticmethod
    def get_feeding_stats(start_date, end_date):
        """Статистика кормления за период"""
        from rabbitcrm.apps.feeding.models import FeedDistribution, FeedStock
        
        stats = {
            "total_distributions": 0,
            "total_quantity": 0,
            "by_feed_type": {},
            "cost_breakdown": [],
            "stock_levels": [],
        }
        
        distributions = FeedDistribution.objects.filter(
            distribution_date__range=[start_date, end_date]
        )
        
        stats["total_distributions"] = distributions.count()
        stats["total_quantity"] = distributions.aggregate(Sum("quantity"))["quantity__sum"] or 0
        
        # По типам кормов
        feed_type_stats = distributions.values(
            "feed__feed_type__name"
        ).annotate(
            total=Sum("quantity"),
            count=Count("id")
        )
        stats["by_feed_type"] = {
            item["feed__feed_type__name"]: {
                "total": float(item["total"]),
                "count": item["count"]
            }
            for item in feed_type_stats
        }
        
        # Остатки на складе
        stocks = FeedStock.objects.filter(quantity__gt=0)[:20]
        stats["stock_levels"] = [
            {
                "feed": str(stock.feed),
                "quantity": float(stock.quantity),
                "value": float(stock.total_value),
            }
            for stock in stocks
        ]
        
        return stats


class ProductionAnalytics:
    """Аналитика производства"""
    
    @staticmethod
    def get_production_metrics():
        """Ключевые показатели эффективности"""
        from rabbitcrm.apps.rabbits.models import Rabbit, Weight
        from rabbitcrm.apps.breeding.models import Kindling
        
        metrics = {
            "total_rabbits": Rabbit.objects.count(),
            "breeding_stock": Rabbit.objects.filter(status="BREEDING").count(),
            "meat_production": Rabbit.objects.filter(status="MEAT").count(),
            "avg_weight": float(Weight.objects.aggregate(Avg("weight"))["weight__avg"] or 0),
            "avg_daily_gain": 0,
            "reproduction_rate": 0,
            "mortality_rate": 0,
        }
        
        # Средний суточный прирост (примерно)
        metrics["avg_daily_gain"] = round(metrics["avg_weight"] / 90, 2)  # Предполагаем 90 дней до убоя
        
        # Коэффициент размножения
        total_offspring = Kindling.objects.aggregate(Sum("litter_size"))["litter_size__sum"] or 0
        total_mothers = Kindling.objects.values("female_id").distinct().count()
        if total_mothers > 0:
            metrics["reproduction_rate"] = round(total_offspring / total_mothers, 2)
        
        return metrics
