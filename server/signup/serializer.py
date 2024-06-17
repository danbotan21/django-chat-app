from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import CreateUser

class SignupSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CreateUser
        fields = ["username",  "email", "password", 'confirm_password', "user_picture", 'friends', 'id', ]
        
        
    
    
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    
    def validate(self, data):
        password = data["password"]
        confirm_password = data.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({"password": "Passwords do not match"})

        validate_password(password)

        return data



    