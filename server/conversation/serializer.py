from rest_framework import serializers
from .models import  Messages, Conversation
from signup.serializer import SignupSerializer
class MessageSerializer(serializers.ModelSerializer):
    
    user = SignupSerializer(source='sender')
    
    class Meta:
        model = Messages
        fields = [ 'text', 'image', 'files', 'created_at', 'sender', 'conversation', 'user']
    

class ConversationSerializer(serializers.ModelSerializer):
    user1 = serializers.PrimaryKeyRelatedField(read_only=True)  
    user2 = serializers.PrimaryKeyRelatedField(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [  'id', 'user1', 'user2', 'messages']
    
