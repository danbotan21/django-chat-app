from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from signup.models import CreateUser
from signup.serializer import PublicUserSerializer
from .models import Conversation, Messages
from .serializer import MessageSerializer

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


def room_name(user_id, friend_id):
    """Same WebSocket group for both people in a conversation."""
    return f'chat_{min(user_id, friend_id)}_{max(user_id, friend_id)}'


def broadcast(message):
    """Send a saved message to everyone connected to that conversation."""
    conversation = message.conversation
    async_to_sync(get_channel_layer().group_send)(
        room_name(conversation.user1_id, conversation.user2_id),
        {'type': 'chat_message', 'message': MessageSerializer(message).data},
    )


def get_conversation(user, friend_id):
    """The conversation with a friend, or None if they are not friends."""
    friend = CreateUser.objects.filter(id=friend_id).first()
    if friend is None or not user.friends.filter(id=friend.id).exists():
        return None, None
    return friend, Conversation.between(user, friend)


def last_message_preview(message):
    if message is None:
        return None
    if message.text:
        text = message.text
    elif message.image:
        text = 'Sent a photo'
    else:
        text = 'Sent a file'
    return {'text': text, 'created_at': message.created_at, 'sender': message.sender_id}


class Friends(APIView):
    def get(self, request):
        """My friends, the most recent conversation first."""
        friends = []
        for friend in request.user.friends.all():
            conversation = Conversation.between(request.user, friend)
            last = conversation.messages.last() if conversation else None
            friends.append({**PublicUserSerializer(friend).data, 'last_message': last_message_preview(last)})

        friends.sort(key=lambda f: f['last_message']['created_at'].timestamp() if f['last_message'] else 0,
                     reverse=True)
        return Response(friends)

    def post(self, request):
        """Add a friend (both ways) and open a conversation with them."""
        friend = CreateUser.objects.filter(id=request.data.get('friendId')).first()
        if friend is None or friend == request.user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        request.user.friends.add(friend)
        friend.friends.add(request.user)
        if Conversation.between(request.user, friend) is None:
            Conversation.objects.create(user1=request.user, user2=friend)

        return Response({**PublicUserSerializer(friend).data, 'last_message': None},
                        status=status.HTTP_201_CREATED)


class FindUsers(APIView):
    def get(self, request):
        """People who are not my friends yet, filtered by ?search=."""
        users = (CreateUser.objects
                 .exclude(id=request.user.id)
                 .exclude(id__in=request.user.friends.values('id'))
                 .filter(username__icontains=request.query_params.get('search', '').strip())
                 .order_by('username')[:20])
        return Response(PublicUserSerializer(users, many=True).data)


class ConversationWithFriend(APIView):
    def get(self, request):
        friend, conversation = get_conversation(request.user, request.query_params.get('friendUserId'))
        if conversation is None:
            return Response({'error': 'You can only open conversations with your friends.'},
                            status=status.HTTP_404_NOT_FOUND)

        return Response({
            'conversation': conversation.id,
            'friend': PublicUserSerializer(friend).data,
            'messages': MessageSerializer(conversation.messages.all(), many=True).data,
        })


class SendMessage(APIView):
    """Text messages normally go through the WebSocket; this is the HTTP fallback."""

    def post(self, request):
        _, conversation = get_conversation(request.user, request.data.get('friendUserId'))
        text = (request.data.get('sendMessage') or '').strip()
        if conversation is None or not text:
            return Response({'error': 'Message could not be sent.'}, status=status.HTTP_400_BAD_REQUEST)

        message = Messages.objects.create(text=text, sender=request.user, conversation=conversation)
        broadcast(message)
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class SendUpload(APIView):
    """Shared code for sending a photo or a file."""
    form_field = None
    model_field = None

    def post(self, request):
        _, conversation = get_conversation(request.user, request.data.get('friendUserId'))
        upload = request.FILES.get(self.form_field)
        if conversation is None or upload is None:
            return Response({'error': 'Nothing to send.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > MAX_UPLOAD_SIZE:
            return Response({'error': 'Files can be at most 10 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        if self.form_field == 'image' and not (upload.content_type or '').startswith('image/'):
            return Response({'error': 'Please choose an image.'}, status=status.HTTP_400_BAD_REQUEST)

        message = Messages.objects.create(sender=request.user, conversation=conversation,
                                          **{self.model_field: upload})
        broadcast(message)
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class SendImage(SendUpload):
    form_field = 'image'
    model_field = 'image'


class SendFile(SendUpload):
    form_field = 'file'
    model_field = 'files'
