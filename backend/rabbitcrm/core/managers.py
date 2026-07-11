from django.db import models


class ActiveManager(models.Manager):
    """Менеджер для активных объектов"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
    
    def active(self):
        return self.get_queryset()


class SoftDeleteManager(models.Manager):
    """Менеджер для мягко удаляемых объектов"""
    
    def get_queryset(self):
        return super().get_queryset()
    
    def all_with_deleted(self):
        return super().get_queryset()
