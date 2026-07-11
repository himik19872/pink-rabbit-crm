from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Разрешение: только владелец может редактировать"""
    
    def has_object_permission(self, request, view, obj):
        # GET, HEAD, OPTIONS - безопасные методы
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Проверка владения (если у объекта есть поле owner)
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        
        # Для объектов без owner - только администратор
        return request.user.is_staff


class IsAdminOrReadOnly(permissions.BasePermission):
    """Разрешение: администратор ��ожет писать, все могут читать"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
