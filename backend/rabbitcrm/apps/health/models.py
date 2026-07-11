from django.db import models
from django.utils import timezone


class HealthEvent(models.Model):
    """Ветеринарное мероприятие"""
    
    EVENT_TYPE_CHOICES = [
        ("VACCINATION", "Прививка"),
        ("TREATMENT", "Лечение"),
        ("QUARANTINE", "Карантин"),
        ("CHECKUP", "Осмотр"),
        ("SURGERY", "Хирургия"),
        ("DEWORMING", "Дегельминтизация"),
        ("OTHER", "Другое"),
    ]
    
    RISK_LEVEL_CHOICES = [
        ("LOW", "Низкий"),
        ("MEDIUM", "Средний"),
        ("HIGH", "Высокий"),
    ]
    
    rabbit = models.ForeignKey("rabbits.Rabbit", on_delete=models.CASCADE, related_name="health_events", verbose_name="Кролик")
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, verbose_name="Тип мероприятия")
    date = models.DateField(default=timezone.now, verbose_name="Дата")
    description = models.TextField(verbose_name="Описание")
    medication = models.CharField(max_length=200, blank=True, verbose_name="Лекарство")
    dosage = models.CharField(max_length=100, blank=True, verbose_name="Дозировка")
    vet_name = models.CharField(max_length=100, blank=True, verbose_name="Ветеринар")
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES, default="LOW", verbose_name="Риск")
    is_urgent = models.BooleanField(default=False, verbose_name="Срочно")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Ветеринарное мероприятие"
        verbose_name_plural = "Ветеринарные мероприятия"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["rabbit", "-date"]),
            models.Index(fields=["is_urgent", "-date"]),
        ]
    
    def __str__(self):
        return f"{self.rabbit} - {self.get_event_type_display()} ({self.date})"
    
    @property
    def is_active(self):
        """Активно ли мероприятие (например, карантин)"""
        return self.event_type == "QUARANTINE" and self.date <= timezone.now().date()
    
    @property
    def treatment_end_date(self):
        """Дата окончания лечения (если известно)"""
        # В реальности можно добавить fields for start/end dates
        return self.date


class MedicalRecord(models.Model):
    """Медицинская карта кролика"""
    
    rabbit = models.OneToOneField("rabbits.Rabbit", on_delete=models.CASCADE, related_name="medical_record", verbose_name="Кролик")
    blood_type = models.CharField(max_length=10, blank=True, verbose_name="Группа крови")
    allergies = models.TextField(blank=True, verbose_name="Аллергии")
    chronic_illnesses = models.TextField(blank=True, verbose_name="Хронические заболевания")
    last_vaccination = models.DateField(null=True, blank=True, verbose_name="Последняя прививка")
    next_vaccination = models.DateField(null=True, blank=True, verbose_name="Следующая прививка")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Медицинская карта"
        verbose_name_plural = "Медицинские карты"
    
    def __str__(self):
        return f"Медкарта {self.rabbit}"


class Quarantine(models.Model):
    """Карантин"""
    
    rabbit = models.ForeignKey("rabbits.Rabbit", on_delete=models.CASCADE, related_name="quarantines", verbose_name="Кролик")
    start_date = models.DateField(default=timezone.now, verbose_name="Начало карантина")
    end_date = models.DateField(verbose_name="Конец карантина")
    location = models.ForeignKey("housing.Cage", on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Клетка карантина")
    reason = models.TextField(verbose_name="Причина карантина")
    observations = models.TextField(blank=True, verbose_name="Наблюдения")
    is_completed = models.BooleanField(default=False, verbose_name="Завершен")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Карантин"
        verbose_name_plural = "Карантины"
        ordering = ["-start_date"]
        indexes = [
            models.Index(fields=["rabbit", "-start_date"]),
            models.Index(fields=["end_date"]),
        ]
    
    def __str__(self):
        return f"Карантин {self.rabbit} ({self.start_date} - {self.end_date})"
    
    @property
    def is_active(self):
        """Активен ли карантин"""
        return not self.is_completed and self.start_date <= timezone.now().date() <= self.end_date
