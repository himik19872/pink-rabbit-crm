from django.urls import path
from .views import api_root, current_user

urlpatterns = [
    path("", api_root, name="api-root"),
    path("auth/users/me/", current_user, name="user-me"),
]
