from django.db import models
from django.db.models import Q

from signup.models import CreateUser


class Conversation(models.Model):
    user1 = models.ForeignKey(CreateUser, on_delete=models.CASCADE, related_name='conversations_user1')
    user2 = models.ForeignKey(CreateUser, on_delete=models.CASCADE, related_name='conversations_user2')

    @classmethod
    def between(cls, user, friend):
        return cls.objects.filter(Q(user1=user, user2=friend) | Q(user1=friend, user2=user)).first()


class Messages(models.Model):
    text = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='images_sent', blank=True, null=True)
    files = models.FileField(upload_to='files', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(CreateUser, on_delete=models.CASCADE, related_name='sent_messages')
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', blank=True, null=True)

    class Meta:
        ordering = ['created_at', 'id']
