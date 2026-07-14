from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор пользователя"""

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_active", "date_joined", "last_login"]
        read_only_fields = ["id", "date_joined", "last_login"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания пользователя"""

    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "is_staff", "is_active"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор обновления пользователя (без пароля)"""

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_active"]
        read_only_fields = ["id"]


class ChangePasswordSerializer(serializers.Serializer):
    """Сериализатор смены пароля"""

    password = serializers.CharField(write_only=True, required=True, min_length=6)
