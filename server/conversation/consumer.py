import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Messages
from .serializer import MessageSerializer
from .views import get_conversation, room_name


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        friend_id = int(self.scope['url_route']['kwargs']['friendId'])

        # only logged-in users, and only for a conversation with a friend
        if not self.user.is_authenticated:
            await self.close()
            return
        self.conversation = await self.find_conversation(friend_id)
        if self.conversation is None:
            await self.close()
            return

        # both people join the same group, whatever the order of their ids
        self.room_group_name = room_name(self.user.id, friend_id)
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        text = (data.get('message') or '').strip()
        if data.get('type', 'message') != 'message' or not text:
            return

        saved = await self.save_message(text)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'chat_message', 'message': saved},
        )

    async def chat_message(self, event):
        # send the message to the browser
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def find_conversation(self, friend_id):
        return get_conversation(self.user, friend_id)[1]

    @database_sync_to_async
    def save_message(self, text):
        message = Messages.objects.create(text=text, sender=self.user, conversation=self.conversation)
        return MessageSerializer(message).data
