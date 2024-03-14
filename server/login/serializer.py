from rest_framework import serializers
from signup.models import CreateUser


class LogInSerializer(serializers.ModelSerializer):
    class Meta: 
        model  = CreateUser
        fields = ['email', 'password']