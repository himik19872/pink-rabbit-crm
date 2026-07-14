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
        ("YOUNG", "Молодняк"),
        ("BREEDING", "Племенной"),
        ("MEAT", "Мясной"),
        ("PET", "Декоративный"),
        ("DECEASED", "Умер"),
        ("SOLD", "Продан"),
    ]
    
    id = models.AutoField(primary_key=True)
    rabbit_id = models.CharField(max_length=50, unique=True, verbose_name="ID кролика")
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
            self.rabbit_id = self._generate_rabbit_id()
        super().save(*args, **kwargs)

    def _generate_rabbit_id(self):
        """Генерация генеалогического ID: M001-F002-00001"""
        # Основатели линии — короткий ID
        if not self.mother_id and not self.father_id:
            prefix = "M" if self.gender == "M" else "F"
            last = Rabbit.objects.filter(rabbit_id__regex=rf"^{prefix}\d+$").order_by("-id").first()
            if last:
                num = int(last.rabbit_id[1:]) + 1
            else:
                num = 1
            return f"{prefix}{num:03d}"

        # Дети — составной ID: отец-мать-номер
        father_part = self.father.rabbit_id if self.father else "X"
        mother_part = self.mother.rabbit_id if self.mother else "X"
        parent_prefix = f"{father_part}-{mother_part}"

        # Считаем сколько детей у этой пары
        count = Rabbit.objects.filter(
            mother_id=self.mother_id,
            father_id=self.father_id,
        ).count() + 1

        return f"{parent_prefix}-{count:05d}"
    
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
        """Количество прямого потомства"""
        return self.children_mother.count() + self.children_father.count()

    def get_total_offspring_count(self):
        """Количество всего потомства (включая внуков) — рекурсивно"""
        direct = set(self.children_mother.all()) | set(self.children_father.all())
        total = len(direct)
        for child in direct:
            total += child.get_total_offspring_count()
        return total

    def get_offspring_by_generation(self):
        """Потомство по поколениям: {1: count, 2: count, ...}"""
        result = {}
        self._collect_offspring_depth(self, 1, result, set())
        return result

    @classmethod
    def _collect_offspring_depth(cls, rabbit, depth, result, visited):
        if rabbit.id in visited:
            return
        visited.add(rabbit.id)
        result[depth] = result.get(depth, 0)
        children = set(rabbit.children_mother.all()) | set(rabbit.children_father.all())
        result[depth] += len(children)
        for child in children:
            cls._collect_offspring_depth(child, depth + 1, result, visited)
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


class Slaughter(models.Model):
    """Учёт забоя кролика на мясо"""

    rabbit = models.ForeignKey(Rabbit, on_delete=models.PROTECT, related_name="slaughters", verbose_name="Кролик")
    slaughter_date = models.DateField(default=timezone.now, verbose_name="Дата забоя")
    live_weight = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Живой вес (г)")
    carcass_weight = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Чистый вес тушки (г)")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Забой"
        verbose_name_plural = "Забои"
        ordering = ["-slaughter_date"]
        indexes = [
            models.Index(fields=["-slaughter_date"]),
        ]

    def __str__(self):
        return f"Забой {self.rabbit} — {self.slaughter_date}"

    @property
    def dressing_percentage(self):
        """Убойный выход в %"""
        if self.live_weight == 0:
            return 0
        return round((float(self.carcass_weight) / float(self.live_weight)) * 100, 1)
