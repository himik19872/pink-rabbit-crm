from rest_framework import mixins


class SoftDeleteMixin:
    """Миксин для мягко удаляемых объектов"""
    
    def perform_destroy(self, instance):
        """Мягкое удаление"""
        instance.soft_delete()
