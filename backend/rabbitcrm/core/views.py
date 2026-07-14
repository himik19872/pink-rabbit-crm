from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, ChangePasswordSerializer
)


def api_root(request):
    """Корневой endpoint API"""
    data = {
        "message": "RabbitCRM API",
        "version": "1.0.0",
        "endpoints": {
            "rabbits": "/api/rabbits/",
            "housing": "/api/housing/",
            "health": "/api/health/",
            "feeding": "/api/feeding/",
            "breeding": "/api/breeding/",
            "analytics": "/api/analytics/",
            "users": "/api/users/",
            "docs": "/api/docs/",
        }
    }
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Текущий пользователь"""
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
    })


class UserViewSet(viewsets.ModelViewSet):
    """Управление пользователями (только для администраторов)"""

    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminUser])
    def change_password(self, request, pk=None):
        """Смена пароля пользователя"""
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data["password"])
            user.save()
            return Response({"status": "password changed"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
