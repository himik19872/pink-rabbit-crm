from django.db import models

# Core models for RabbitCRM
# This app contains shared utilities and base models

class BaseModel(models.Model):
    """Базовая модель с общими полями"""
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    
    class Meta:
        abstract = True
    
    def soft_delete(self):
        """Мягкое удаление"""
        self.is_active = False
        self.save()
    
    def restore(self):
        """Восстановление"""
        self.is_active = True
        self.save()
