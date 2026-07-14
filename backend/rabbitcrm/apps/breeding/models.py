from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator


class BreedingPair(models.Model):
    """Племенная пара"""
    
    STATUS_CHOICES = [
        ("ACTIVE", "Активна"),
        ("INACTIVE", "Неактивна"),
        ("SEPARATED", "Разделены"),
        ("COMPLETED", "Работа завершена"),
    ]
    
    male = models.ForeignKey("rabbits.Rabbit", on_delete=models.PROTECT, related_name="breeding_pairs_male", verbose_name="Самец")
    female = models.ForeignKey("rabbits.Rabbit", on_delete=models.PROTECT, related_name="breeding_pairs_female", verbose_name="Самка")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE", verbose_name="Статус")
    started_at = models.DateField(default=timezone.now, verbose_name="Начало работы")
    ended_at = models.DateField(null=True, blank=True, verbose_name="Окончание")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Племенная пара"
        verbose_name_plural = "Племенные пары"
        ordering = ["-started_at"]
        constraints = [
            models.CheckConstraint(check=~models.Q(male=models.F("female")), name="male_female_different"),
        ]
    
    def __str__(self):
        return f"{self.male.name}/{self.male.rabbit_id} × {self.female.name}/{self.female.rabbit_id}"
    
    def clean(self):
        """Валидация"""
        if self.male.gender != "M":
            raise ValidationError({"male": "Выбранный кролик не является самцом"})
        if self.female.gender != "F":
            raise ValidationError({"female": "Выбранный кролик не является самкой"})
        if self.male_id == self.female_id:
            raise ValidationError("Самец и самка не могут быть одним и тем же кроликом")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Mating(models.Model):
    """Спаривание"""
    
    pair = models.ForeignKey(BreedingPair, on_delete=models.CASCADE, related_name="matings", verbose_name="Пара")
    mating_date = models.DateField(default=timezone.now, verbose_name="Дата спаривания")
    method = models.CharField(max_length=20, choices=[
        ("Natural", "Естественное"),
        ("Artificial", "Искусственное"),
    ], default="Natural", verbose_name="Метод")
    success = models.BooleanField(default=False, verbose_name="Успешно")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Спаривание"
        verbose_name_plural = "Спаривания"
        ordering = ["-mating_date"]
        indexes = [
            models.Index(fields=["pair", "-mating_date"]),
        ]
    
    def __str__(self):
        return f"{self.pair} - {self.mating_date}"


class Pregnancy(models.Model):
    """Беременность"""
    
    female = models.ForeignKey("rabbits.Rabbit", on_delete=models.PROTECT, related_name="pregnancies", verbose_name="Самка")
    male = models.ForeignKey("rabbits.Rabbit", on_delete=models.SET_NULL, null=True, blank=True, related_name="pregnancies_male", verbose_name="Самец-производитель")
    mating_date = models.DateField(verbose_name="Дата спаривания")
    expected_due_date = models.DateField(verbose_name="Ожидаемая дата окота")
    actual_due_date = models.DateField(null=True, blank=True, verbose_name="Фактическая дата окота")
    confirmed = models.BooleanField(default=False, verbose_name="Подтверждена")
    ultrasound_date = models.DateField(null=True, blank=True, verbose_name="Дата УЗИ")
    embryos_count = models.PositiveIntegerField(null=True, blank=True, verbose_name="Количество эмбрионов")
    is_complete = models.BooleanField(default=False, verbose_name="Завершена")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Беременность"
        verbose_name_plural = "Беременности"
        ordering = ["-expected_due_date"]
        indexes = [
            models.Index(fields=["female", "-expected_due_date"]),
        ]
    
    def __str__(self):
        male_name = self.male.name if self.male else "?"
        return f"{self.female} × {male_name} — {self.expected_due_date}"

    @property
    def remaining_days(self):
        """Осталось дней до окота (если беременность активна)"""
        if self.is_complete:
            return None
        from django.utils import timezone
        delta = self.expected_due_date - timezone.now().date()
        return delta.days
    
    def save(self, *args, **kwargs):
        if not self.expected_due_date and self.mating_date:
            # Срок беременности у кроликов ~30-31 день
            from datetime import timedelta
            self.expected_due_date = self.mating_date + timedelta(days=31)
        super().save(*args, **kwargs)


class Kindling(models.Model):
    """Окот"""
    
    female = models.ForeignKey("rabbits.Rabbit", on_delete=models.PROTECT, related_name="kindlings", verbose_name="Самка")
    kindling_date = models.DateField(default=timezone.now, verbose_name="Дата окота")
    litter_size = models.PositiveIntegerField(verbose_name="Количество в помете")
    live_born = models.PositiveIntegerField(verbose_name="Живорожденных")
    stillborn = models.PositiveIntegerField(default=0, verbose_name="Мертворожденных")
    mummies = models.PositiveIntegerField(default=0, verbose_name="Мумифицированных")
    cage = models.ForeignKey("housing.Cage", on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Клетка")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Окот"
        verbose_name_plural = "Окоты"
        ordering = ["-kindling_date"]
        indexes = [
            models.Index(fields=["female", "-kindling_date"]),
        ]
    
    def __str__(self):
        return f"{self.female} - {self.kindling_date} ({self.litter_size} шт.)"
    
    @property
    def survival_rate(self):
        """Выживаемость"""
        if self.live_born == 0:
            return 0
        return round((self.live_born / self.litter_size) * 100, 1)


class KindlingDetail(models.Model):
    """Детали крольчат в помете"""
    
    GENDER_CHOICES = [
        ("M", "Самец"),
        ("F", "Самка"),
    ]
    
    kindling = models.ForeignKey(Kindling, on_delete=models.CASCADE, related_name="details", verbose_name="Окот")
    rabbit = models.ForeignKey("rabbits.Rabbit", on_delete=models.CASCADE, verbose_name="Кролик")
    birth_order = models.PositiveIntegerField(verbose_name="Порядок рождения")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Пол")
    birth_weight = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Вес при рождении (г)")
    is_surviving = models.BooleanField(default=True, verbose_name="Выжил")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Крольчонок"
        verbose_name_plural = "Крольчата"
        ordering = ["birth_order"]
    
    def __str__(self):
        return f"Крольчонок {self.rabbit.rabbit_id} ({self.get_gender_display()})"


class GenealogicalLine(models.Model):
    """Генеалогическая линия (линия самца или семейство самки)"""

    LINE_TYPE_CHOICES = [
        ("MALE", "Отцовская линия"),
        ("FEMALE", "Материнское семейство"),
    ]

    name = models.CharField(max_length=200, verbose_name="Название линии")
    line_type = models.CharField(max_length=10, choices=LINE_TYPE_CHOICES, verbose_name="Тип линии")
    founder = models.ForeignKey(
        "rabbits.Rabbit", on_delete=models.PROTECT, related_name="founded_lines",
        verbose_name="Основатель линии"
    )
    description = models.TextField(blank=True, verbose_name="Описание")
    established_date = models.DateField(default=timezone.now, verbose_name="Дата основания")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Генеалогическая линия"
        verbose_name_plural = "Генеалогические линии"
        ordering = ["line_type", "name"]
        indexes = [
            models.Index(fields=["line_type", "-established_date"]),
        ]

    def __str__(self):
        return f"{self.get_line_type_display()}: {self.name}"

    @property
    def member_count(self):
        """Количество кроликов в линии (вычисляемое)"""
        from rabbitcrm.apps.rabbits.models import Rabbit

        if self.line_type == "MALE":
            count = 1
            queue = [self.founder]
            depth = 6  # максимальная глубина поиска
            while queue and depth > 0:
                rabbit = queue.pop(0)
                children = Rabbit.objects.filter(father=rabbit)
                count += children.count()
                queue.extend(list(children))
                depth -= 1
            return count
        else:
            count = 1
            queue = [self.founder]
            depth = 6
            while queue and depth > 0:
                rabbit = queue.pop(0)
                children = Rabbit.objects.filter(mother=rabbit)
                count += children.count()
                queue.extend(list(children))
                depth -= 1
            return count


class RabbitLine(models.Model):
    """Привязка кролика к генеалогической линии"""

    rabbit = models.ForeignKey(
        "rabbits.Rabbit", on_delete=models.CASCADE, related_name="genealogical_lines",
        verbose_name="Кролик"
    )
    line = models.ForeignKey(
        GenealogicalLine, on_delete=models.CASCADE, related_name="members",
        verbose_name="Генеалогическая линия"
    )
    generation = models.PositiveIntegerField(default=0, verbose_name="Поколение (0 = основатель)")
    joined_at = models.DateField(default=timezone.now, verbose_name="Дата включения")

    class Meta:
        verbose_name = "Кролик в линии"
        verbose_name_plural = "Кролики в линиях"
        unique_together = ["rabbit", "line"]

    def __str__(self):
        return f"{self.rabbit} → {self.line} (F{self.generation})"
