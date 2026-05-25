from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Conversation, Messages
from signup.models import CreateUser
from .serializer import ConversationSerializer, MessageSerializer
from signup.serializer import SignupSerializer


class ConversationWithFriend(APIView) :
    def get(self, request):  
        
        user_id = int(request.query_params.get('userId'))
        friend_id = int(request.query_params.get('friendUserId'))


        try:
            user = CreateUser.objects.get(id=user_id)
            friend = CreateUser.objects.get(id=friend_id)
            
            conversation = Conversation.objects.filter(
             Q(user1=user, user2=friend) | Q(user1=friend, user2=user))[0]
            
            
            messages = Messages.objects.filter(conversation=conversation)   
            
            conversation_serializer = ConversationSerializer(conversation)
            message_serializer = MessageSerializer(messages, many=True)
            friend_serializer = SignupSerializer(friend)
        
            return Response({'conversation': conversation_serializer.data, 'message': message_serializer.data, 'friend': friend_serializer.data})
            

        except Exception as e:
            return Response({'errorMessage': 'A apărut o eroare: {}'.format(str(e))})



class SendMessage(APIView) :
    def post(self, request) : 
        data_from_client = request.data
    
        userId = data_from_client.get('userId')
        friendUserId = data_from_client.get('friendUserId')
        sendMessage = data_from_client.get('sendMessage')

        
        try:
            user = CreateUser.objects.get(id=userId)
            friend = CreateUser.objects.get(id=friendUserId)
            
            conversation = Conversation.objects.filter(Q(user1=user, user2=friend) | Q(user1=friend, user2=user))[0]

            newMessage = Messages.objects.create(text=sendMessage, sender=user, conversation=conversation)
            newMessage.save() 
            
            message_serializer = MessageSerializer(newMessage)
            
            return Response({'success': 'Totul a mers bine', 'mesajul': message_serializer.data},status=status.HTTP_201_CREATED)
        
        except Exception as e :
            return Response ({'errorMessage': 'Ceva nu a mers bine: {}'.format(str(e))}, status=status.HTTP_400_BAD_REQUEST)


        
        
        
class SendImage(APIView) :
    def post(self, request) : 
    
        userId = request.data.get('userId')
        friendUserId = request.data.get('friendUserId')
        sendImage = request.FILES.get('image')

        
        try:
            user = CreateUser.objects.get(id=userId)
            friend = CreateUser.objects.get(id=friendUserId)
            
            conversation = Conversation.objects.filter(Q(user1=user, user2=friend) | Q(user1=friend, user2=user))[0]

            newMessage = Messages.objects.create(image=sendImage, sender=user, conversation=conversation)
            newMessage.save() 
            
            message_serializer = MessageSerializer(newMessage)
            
            return Response({'success': 'Totul a mers bine', 'mesajul': message_serializer.data},status=status.HTTP_201_CREATED)
        
        except Exception as e :
            return Response ({'errorMessage': 'Ceva nu a mers bine: {}'.format(str(e))}, status=status.HTTP_400_BAD_REQUEST)        
        



class SendFile(APIView) :
    def post(self, request) : 
    
        userId = request.data.get('userId')
        friendUserId = request.data.get('friendUserId')
        sendFile = request.FILES.get('file')

        
        try:
            user = CreateUser.objects.get(id=userId)
            friend = CreateUser.objects.get(id=friendUserId)
            
            conversation = Conversation.objects.filter(Q(user1=user, user2=friend) | Q(user1=friend, user2=user))[0]

            newMessage = Messages.objects.create(files=sendFile, sender=user, conversation=conversation)
            newMessage.save() 
            
            message_serializer = MessageSerializer(newMessage)
            
            return Response({'success': 'Totul a mers bine', 'mesajul': message_serializer.data},status=status.HTTP_201_CREATED)
        
        except Exception as e :
            return Response ({'errorMessage': 'Ceva nu a mers bine: {}'.format(str(e))}, status=status.HTTP_400_BAD_REQUEST)    