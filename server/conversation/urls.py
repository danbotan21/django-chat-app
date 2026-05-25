from django.urls import path
from .views import ConversationWithFriend, SendMessage, SendImage, SendFile


urlpatterns = [
    path('',  ConversationWithFriend.as_view(), name='conversation_with_friend'),
    path('send-message/', SendMessage.as_view(), name='send-message'),
    path('send-image/',  SendImage.as_view(), name='send-image'),
    path('send-file/',  SendFile.as_view(), name='send-file'),
    path('last-message/',  ConversationWithFriend.as_view(), name='conversation_with_friend'),
   
]

