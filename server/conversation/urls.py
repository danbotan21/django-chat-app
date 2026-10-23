from django.urls import path
from .views import ConversationWithFriend, FindUsers, Friends, SendFile, SendImage, SendMessage


urlpatterns = [
    path('', ConversationWithFriend.as_view(), name='conversation-with-friend'),
    path('friends/', Friends.as_view(), name='friends'),
    path('users/', FindUsers.as_view(), name='find-users'),
    path('send-message/', SendMessage.as_view(), name='send-message'),
    path('send-image/', SendImage.as_view(), name='send-image'),
    path('send-file/', SendFile.as_view(), name='send-file'),
]
