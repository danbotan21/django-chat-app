from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import CreateUser


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CreateUser
        fields = ['id', 'username', 'email', 'password', 'confirm_password', 'user_picture']

    def validate(self, data):
        if data['password'] != data.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class PublicUserSerializer(serializers.ModelSerializer):
    """What other users are allowed to see about someone."""
    user_picture = serializers.SerializerMethodField()

    class Meta:
        model = CreateUser
        fields = ['id', 'username', 'user_picture']

    def get_user_picture(self, user):
        return user.user_picture.url if user.user_picture else ''
