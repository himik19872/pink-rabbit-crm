from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator


class FeedType(models.Model):
    """Тип корма"""
    
    CATEGORY_CHOICES = [
        ("HAY", "Сено"),
        ("GRAIN", "Зерно"),
        ("COMBINED", "Комбикорм"),
        ("FRESH", "Свежие корма"),
        ("SUPPLEMENT", "Добавки"),
        ("OTHER", "Другое"),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Название")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="Категория")
    description = models.TextField(blank=True, verbose_name="Описание")
    nutritional_value = models.JSONField(blank=True, null=True, verbose_name="Пищевая ценность")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Тип корма"
        verbose_name_plural = "Типы кормов"
        ordering = ["category", "name"]
    
    def __str__(self):
        return f"{self.get_category_display()}: {self.name}"


class Feed(models.Model):
    """Корм"""
    
    feed_type = models.ForeignKey(FeedType, on_delete=models.CASCADE, related_name="feeds", verbose_name="Тип корма")
    name = models.CharField(max_length=200, verbose_name="Название")
    brand = models.CharField(max_length=100, blank=True, verbose_name="Бренд")
    batch_number = models.CharField(max_length=50, blank=True, verbose_name="Номер партии")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="Срок годности")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Корм"
        verbose_name_plural = "Корма"
        ordering = ["feed_type", "name"]
        indexes = [
            models.Index(fields=["expiry_date"]),
            models.Index(fields=["batch_number"]),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.brand or 'Без бренда'})"
    
    @property
    def is_expired(self):
        """Просрочен ли корм"""
        if not self.expiry_date:
            return False
        return timezone.now().date() > self.expiry_date


class FeedStock(models.Model):
    """Склад кормов"""
    
    feed = models.ForeignKey(Feed, on_delete=models.CASCADE, related_name="stocks", verbose_name="Корм")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Количество (кг)")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Цена за кг")
    total_value = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Стоимость")
    warehouse_location = models.CharField(max_length=100, blank=True, verbose_name="Место хранения")
    last_replenished = models.DateField(default=timezone.now, verbose_name="Последнее пополнение")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Склад корма"
        verbose_name_plural = "Склады кормов"
        ordering = ["-last_replenished"]
    
    def __str__(self):
        return f"{self.feed} - {self.quantity}кг"


class FeedDistribution(models.Model):
    """Раздача корма"""
    
    rabbit = models.ForeignKey("rabbits.Rabbit", on_delete=models.CASCADE, related_name="feed_distributions", verbose_name="Кролик")
    feed = models.ForeignKey(Feed, on_delete=models.CASCADE, related_name="distributions", verbose_name="Корм")
    quantity = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Количество (г)")
    distribution_date = models.DateField(default=timezone.now, verbose_name="Дата раздачи")
    time_of_day = models.CharField(max_length=20, choices=[
        ("MORNING", "Утро"),
        ("AFTERNOON", "День"),
        ("EVENING", "Вечер"),
    ], default="MORNING", verbose_name="Время суток")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Раздача корма"
        verbose_name_plural = "Раздачи кормов"
        ordering = ["-distribution_date", "-time_of_day"]
        indexes = [
            models.Index(fields=["rabbit", "-distribution_date"]),
        ]
    
    def __str__(self):
        return f"{self.rabbit} - {self.feed} - {self.quantity}г"


class DailyFeedPlan(models.Model):
    """План кормления на день"""
    
    date = models.DateField(default=timezone.now, verbose_name="Дата")
    rabbit = models.ForeignKey("rabbits.Rabbit", on_delete=models.CASCADE, related_name="daily_plans", verbose_name="Кролик")
    total_quantity = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Общее количество (г)")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "План кормления"
        verbose_name_plural = "Планы кормления"
        ordering = ["-date"]
        unique_together = ["date", "rabbit"]
    
    def __str__(self):
        return f"План {self.rabbit} - {self.date}"


class FeedPurchase(models.Model):
    """Приход корма (закупка)"""
    
    feed = models.ForeignKey(Feed, on_delete=models.CASCADE, related_name="purchases", verbose_name="Корм")
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], verbose_name="Количество (кг)")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Цена за кг")
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Общая стоимость")
    purchase_date = models.DateField(default=timezone.now, verbose_name="Дата закупки")
    supplier = models.CharField(max_length=200, blank=True, verbose_name="Поставщик")
    invoice_number = models.CharField(max_length=50, blank=True, verbose_name="Номер накладной")
    batch_number = models.CharField(max_length=50, blank=True, verbose_name="Номер партии")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="Срок годности")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Приход корма"
        verbose_name_plural = "Приходы кормов"
        ordering = ["-purchase_date"]
    
    def __str__(self):
        return f"{self.feed.name} — {self.quantity_kg} кг × {self.price_per_kg} ₽ = {self.total_cost} ₽ ({self.purchase_date})"
    
    def save(self, *args, **kwargs):
        if not self.total_cost:
            self.total_cost = self.quantity_kg * self.price_per_kg
        super().save(*args, **kwargs)
