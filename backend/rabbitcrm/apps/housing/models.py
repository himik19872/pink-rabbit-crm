from django.db import models
from django.utils import timezone
from rabbitcrm.utils.qr_generator import generate_cage_qr


class Building(models.Model):
    """Корпус/помещение"""
    
    name = models.CharField(max_length=100, verbose_name="Название")
    address = models.CharField(max_length=200, blank=True, verbose_name="Адрес")
    description = models.TextField(blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Помещение"
        verbose_name_plural = "Помещения"
        ordering = ["name"]
    
    def __str__(self):
        return self.name


class Row(models.Model):
    """Ряд в помещении"""
    
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="rows", verbose_name="Помещение")
    number = models.PositiveIntegerField(verbose_name="Номер ряда")
    description = models.CharField(max_length=200, blank=True, verbose_name="Описание")
    
    class Meta:
        verbose_name = "Ряд"
        verbose_name_plural = "Ряды"
        ordering = ["building", "number"]
        unique_together = ["building", "number"]
    
    def __str__(self):
        return f"{self.building} - Ряд {self.number}"
    
    @property
    def full_address(self):
        return f"{self.building.name} - Ряд {self.number}"


class Shelf(models.Model):
    """Ярус/полка"""
    
    row = models.ForeignKey(Row, on_delete=models.CASCADE, related_name="shelves", verbose_name="Ряд")
    number = models.PositiveIntegerField(verbose_name="Номер яруса")
    description = models.CharField(max_length=200, blank=True, verbose_name="Описание")
    
    class Meta:
        verbose_name = "Ярус"
        verbose_name_plural = "Ярусы"
        ordering = ["row", "number"]
        unique_together = ["row", "number"]
    
    def __str__(self):
        return f"{self.row.full_address} - Ярус {self.number}"
    
    @property
    def full_address(self):
        return f"{self.row.full_address} - Ярус {self.number}"


class Cage(models.Model):
    """Клетка"""
    
    shelf = models.ForeignKey(Shelf, on_delete=models.CASCADE, related_name="cages", verbose_name="Ярус")
    number = models.PositiveIntegerField(verbose_name="Номер клетки")
    capacity = models.PositiveIntegerField(default=1, verbose_name="Вместимость")
    current_rabbit = models.ForeignKey(
        "rabbits.Rabbit", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="current_cage", verbose_name="Текущий кролик"
    )
    last_cleaned = models.DateField(null=True, blank=True, verbose_name="Последняя уборка")
    last_disinfected = models.DateField(null=True, blank=True, verbose_name="Последняя дезинфекция")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    qr_code = models.ImageField(upload_to="qr_codes/", blank=True, null=True, verbose_name="QR-код")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Клетка"
        verbose_name_plural = "Клетки"
        ordering = ["shelf", "number"]
        unique_together = ["shelf", "number"]
    
    def __str__(self):
        return f"{self.shelf.full_address} - Клетка {self.number}"
    
    @property
    def full_address(self):
        return f"{self.shelf.full_address} - Клетка {self.number}"
    
    @property
    def address_qr(self):
        """QR-данные для сканирования — только латиница, без кириллицы"""
        return f"RABBITCRM:CAGE:{self.id}"

    @property
    def address_qr_full(self):
        """QR-код с полным адресом (для отладки)"""
        return f"RABBITCRM:CAGE:{self.id}:{self.full_address}"

    @property
    def barcode_text(self):
        """Текст для штрих-кода (Code128) — только ID для компактности"""
        return f"CAGE{self.id:06d}"

    @property
    def label_data(self):
        """Полные данные этикетки для печати"""
        return {
            "id": self.id,
            "address": self.full_address,
            "qr_data": self.address_qr,
            "barcode_text": self.barcode_text,
            "capacity": self.capacity,
            "rabbit_info": self.rabbit_info,
        }
    
    def save(self, *args, **kwargs):
        """При создании генерируем QR-код"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.qr_code:
            # Генерируем QR после сохранения (нужен id)
            self.qr_code = generate_cage_qr(self.id, self.full_address)
            super().save(update_fields=["qr_code"])
    
    @property
    def rabbit_info(self):
        """Информация о текущем кролике для мобильного приложения"""
        if not self.current_rabbit:
            return None
        rabbit = self.current_rabbit
        return {
            "id": rabbit.id,
            "rabbit_id": rabbit.rabbit_id,
            "name": rabbit.name,
            "gender": rabbit.gender,
            "breed": rabbit.breed,
            "birth_date": str(rabbit.birth_date),
            "age_months": rabbit.age_months,
            "status": rabbit.status,
        }
    
    def assign_rabbit(self, rabbit):
        """Назначить кролика клетке"""
        self.current_rabbit = rabbit
        self.save()
    
    def clear_rabbit(self):
        """Освободить клетку"""
        self.current_rabbit = None
        self.save()


class CageMove(models.Model):
    """История перемещений кролика между клетками"""
    
    rabbit = models.ForeignKey("rabbits.Rabbit", on_delete=models.CASCADE, related_name="moves", verbose_name="Кролик")
    from_cage = models.ForeignKey(Cage, on_delete=models.SET_NULL, null=True, blank=True, related_name="moves_from", verbose_name="Из клетки")
    to_cage = models.ForeignKey(Cage, on_delete=models.SET_NULL, null=True, blank=True, related_name="moves_to", verbose_name="В клетку")
    moved_at = models.DateTimeField(default=timezone.now, verbose_name="Время перемещения")
    moved_by = models.CharField(max_length=100, blank=True, verbose_name="Кто переместил")
    reason = models.TextField(blank=True, verbose_name="Причина перемещения")
    
    class Meta:
        verbose_name = "Перемещение клетки"
        verbose_name_plural = "Перемещения клеток"
        ordering = ["-moved_at"]
        indexes = [
            models.Index(fields=["rabbit", "-moved_at"]),
        ]
    
    def __str__(self):
        if self.from_cage and self.to_cage:
            return f"{self.rabbit} - {self.from_cage} → {self.to_cage}"
        return f"{self.rabbit} - {self.to_cage or 'Новая клетка'}"


class WaterConsumption(models.Model):
    """Учёт расхода воды"""
    
    cage = models.ForeignKey(Cage, on_delete=models.CASCADE, related_name="water_consumptions", verbose_name="Клетка")
    date = models.DateField(default=timezone.now, verbose_name="Дата")
    amount_ml = models.PositiveIntegerField(verbose_name="Количество (мл)")
    notes = models.TextField(blank=True, verbose_name="Примечания")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Расход воды"
        verbose_name_plural = "Расход воды"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["cage", "-date"]),
        ]

    def __str__(self):
        return f"{self.cage} — {self.amount_ml} мл ({self.date})"
