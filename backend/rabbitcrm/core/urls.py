from django.urls import path
from .views import api_root, current_user, UserViewSet

urlpatterns = [
    path("", api_root, name="api-root"),
    path("auth/users/me/", current_user, name="user-me"),
    path("users/", UserViewSet.as_view({"get": "list", "post": "create"}), name="user-list"),
    path("users/<int:pk>/", UserViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="user-detail"),
    path("users/<int:pk>/change_password/", UserViewSet.as_view({"post": "change_password"}), name="user-change-password"),
]
