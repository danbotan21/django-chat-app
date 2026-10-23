import os

from rest_framework import serializers

from signup.serializer import PublicUserSerializer
from .models import Messages


class MessageSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(source='sender', read_only=True)
    image = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Messages
        fields = ['id', 'text', 'image', 'files', 'file_name', 'created_at', 'sender', 'conversation', 'user']

    def get_image(self, message):
        return message.image.url if message.image else None

    def get_files(self, message):
        return message.files.url if message.files else None

    def get_file_name(self, message):
        return os.path.basename(message.files.name) if message.files else None
