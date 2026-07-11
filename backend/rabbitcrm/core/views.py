from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


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
    })
