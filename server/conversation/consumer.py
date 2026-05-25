from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from django.db.models import Q
from django.utils import timezone

from .models import Conversation, Messages
from signup.models import CreateUser


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user_id = int(self.scope['url_route']['kwargs']['userId'])
        self.friend_id = int(self.scope['url_route']['kwargs']['friendId'])

        # Numele grupului e unic per conversatie, indiferent de ordinea userilor
        min_id = min(self.user_id, self.friend_id)
        max_id = max(self.user_id, self.friend_id)
        self.room_group_name = f'chat_{min_id}_{max_id}'

        # Intra in grupul conversatiei
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Iese din grup la deconectare
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')

        if message_type == 'message':
            message_text = data.get('message', '')
            sender_id = data.get('userId')

            # Salveaza mesajul in baza de date
            saved = await self.save_message(sender_id, self.friend_id, message_text)
            if saved is None:
                return

            # Trimite mesajul la toti membrii din grup (ambii useri)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': saved,
                }
            )

    async def chat_message(self, event):
        # Trimite mesajul spre browser prin WebSocket
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def save_message(self, sender_id, friend_id, text):
        try:
            user = CreateUser.objects.get(id=sender_id)
            friend = CreateUser.objects.get(id=friend_id)

            conversation = Conversation.objects.filter(
                Q(user1=user, user2=friend) | Q(user1=friend, user2=user)
            ).first()

            if conversation is None:
                return None

            msg = Messages.objects.create(
                text=text,
                sender=user,
                conversation=conversation,
            )

            return {
                'text': msg.text,
                'image': None,
                'files': None,
                'created_at': msg.created_at.isoformat(),
                'sender': user.id,
                'conversation': conversation.id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'user_picture': user.user_picture.url if user.user_picture else '',
                }
            }
        except Exception as e:
            print(f'WebSocket save_message error: {e}')
            return None
