from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.utils.text import slugify


class Rabbit(models.Model):
    """Модель кролика"""
    
    GENDER_CHOICES = [
        ("M", "Самец"),
        ("F", "Самка"),
    ]
    
    STATUS_CHOICES = [
        ("BREEDING", "Племенной"),
        ("MEAT", "Мясной"),
        ("PET", "Декоративный"),
        ("DECEASED", "Умер"),
        ("SOLD", "Продан"),
    ]
    
    id = models.AutoField(primary_key=True)
    rabbit_id = models.CharField(max_length=20, unique=True, verbose_name="ID кролика")
    name = models.CharField(max_length=100, blank=True, verbose_name="Кличка")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Пол")
    birth_date = models.DateField(verbose_name="Дата рождения")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="BREEDING", verbose_name="Статус")
    
    # Родословная
    mother = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, 
        related_name="children_mother", verbose_name="Мать"
    )
    father = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, 
        related_name="children_father", verbose_name="Отец"
    )
    
    # Порода
    breed = models.CharField(max_length=100, blank=True, verbose_name="Порода")
    
    # Метаданные
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    
    class Meta:
        verbose_name = "Кролик"
        verbose_name_plural = "Кролики"
        ordering = ["-birth_date"]
        indexes = [
            models.Index(fields=["rabbit_id"]),
            models.Index(fields=["birth_date"]),
        ]
    
    def __str__(self):
        return f"{self.name or 'Без имени'} ({self.rabbit_id})"
    
    def save(self, *args, **kwargs):
        if not self.rabbit_id:
            # Генерация ID на основе даты и порядкового номера
            year = timezone.now().year
            last_rabbit = Rabbit.objects.filter(birth_date__year=year).order_by("-id").first()
            if last_rabbit:
                number = int(last_rabbit.rabbit_id.split("-")[-1]) + 1
            else:
                number = 1
            self.rabbit_id = f"RB-{year}-{number:04d}"
        super().save(*args, **kwargs)
    
    @property
    def age_months(self):
        """Возраст в месяцах"""
        if not self.birth_date:
            return None
        delta = timezone.now().date() - self.birth_date
        return int(delta.days / 30.44)
    
    @property
    def pedigree(self):
        """Получить родословную (рекурсивно)"""
        pedigree = {"rabbit": self}
        if self.mother_id:
            pedigree["mother"] = self.mother.pedigree if self.mother else None
        else:
            pedigree["mother"] = None
        if self.father_id:
            pedigree["father"] = self.father.pedigree if self.father else None
        else:
            pedigree["father"] = None
        return pedigree
    
    @property
    def is_breeding_stock(self):
        """Является ли кролик племенным"""
        return self.status == "BREEDING"
    
    def get_offspring_count(self):
        """Количество потомства (как мать или отец)"""
        return self.children_mother.count() + self.children_father.count()
    
    def get_full_pedigree(self, depth=3, current_depth=0):
        """Полная родословная с ограничением глубины"""
        if current_depth >= depth:
            return None
        
        pedigree = {
            "id": self.id,
            "rabbit_id": self.rabbit_id,
            "name": self.name,
            "gender": self.gender,
            "birth_date": str(self.birth_date) if self.birth_date else None,
            "mother": None,
            "father": None,
        }
        
        if self.mother_id and current_depth < depth - 1:
            pedigree["mother"] = self.mother.get_full_pedigree(depth, current_depth + 1)
        if self.father_id and current_depth < depth - 1:
            pedigree["father"] = self.father.get_full_pedigree(depth, current_depth + 1)
        
        return pedigree


class Weight(models.Model):
    """Взвешивание кролика"""
    
    rabbit = models.ForeignKey(Rabbit, on_delete=models.CASCADE, related_name="weights", verbose_name="Кролик")
    weight = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Вес (г)")
    measured_at = models.DateTimeField(default=timezone.now, verbose_name="Время взвешивания")
    method = models.CharField(max_length=20, choices=[("manual", "Ручной"), ("auto", "Автоматический")], default="manual", verbose_name="Метод")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Вес"
        verbose_name_plural = "Веса"
        ordering = ["-measured_at"]
        indexes = [
            models.Index(fields=["rabbit", "-measured_at"]),
        ]
    
    def __str__(self):
        return f"{self.rabbit} - {self.weight}г ({self.measured_at.date()})"


class RabbitPhoto(models.Model):
    """Фотография кролика"""
    
    rabbit = models.ForeignKey(Rabbit, on_delete=models.CASCADE, related_name="photos", verbose_name="Кролик")
    photo = models.ImageField(upload_to="rabbit_photos/", verbose_name="Фото")
    caption = models.CharField(max_length=200, blank=True, verbose_name="Подпись")
    is_primary = models.BooleanField(default=False, verbose_name="Основное")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Фото кролика"
        verbose_name_plural = "Фото кроликов"
        ordering = ["-is_primary", "-created_at"]
    
    def __str__(self):
        return f"Фото {self.rabbit}"
