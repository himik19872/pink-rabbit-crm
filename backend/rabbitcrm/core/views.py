from django.http import JsonResponse

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
