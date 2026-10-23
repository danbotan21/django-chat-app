from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from conversation.models import Conversation, Messages
from signup.models import CreateUser

DEMO_DIR = Path(settings.BASE_DIR) / 'demo'
DEMO_EMAIL = 'demo@chat.app'
PASSWORD = 'ChatDemo123!'

USERS = ['maria', 'andrei', 'elena', 'kevin', 'sofia', 'alex', 'irina']
FRIENDS = ['maria', 'andrei', 'elena', 'kevin', 'sofia']  # alex and irina can be added from the app

# (friend, [(minutes ago, sent by demo?, text or ('image'|'file', file name))])
CONVERSATIONS = [
    ('maria', [
        (190, False, 'Hey! Are you coming to the board game night on Saturday?'),
        (186, True, 'Yes! Should I bring anything?'),
        (184, False, 'Maybe some snacks, Andrei is bringing Catan'),
        (12, True, 'Perfect, I will bring chips and lemonade'),
        (4, False, 'Great, see you at 7 🎲'),
    ]),
    ('andrei', [
        (300, False, 'I wrote down what we agreed in the meeting'),
        (299, False, ('file', 'meeting-notes.txt')),
        (295, True, 'Thanks! I will take the WebSocket part'),
        (60, False, 'Pushed the login page, can you review it?'),
        (55, True, 'Sure, looking at it now'),
    ]),
    ('elena', [
        (1500, False, 'Look, the first snow this year!'),
        (1499, False, ('image', 'first-snow.jpg')),
        (1440, True, 'Wow, it looks so cozy ❄️'),
    ]),
    ('kevin', [
        (4000, True, 'Did you finish the database homework?'),
        (3990, False, 'Almost, only the last query is left'),
    ]),
    ('sofia', [
        (9000, False, 'Thanks for the book recommendation!'),
    ]),
]


def user_with_avatar(username, email):
    user, created = CreateUser.objects.get_or_create(username=username, defaults={'email': email})
    if created:
        user.set_password(PASSWORD)
        with open(DEMO_DIR / 'avatars' / f'{username}.jpg', 'rb') as f:
            user.user_picture.save(f'{username}.jpg', File(f), save=False)
        user.save()
    return user


class Command(BaseCommand):
    help = f'Add demo users and conversations. Log in as {DEMO_EMAIL} / {PASSWORD}.'

    @transaction.atomic
    def handle(self, *args, **options):
        if CreateUser.objects.filter(email=DEMO_EMAIL).exists():
            self.stdout.write('Demo data is already there.')
            return

        demo = user_with_avatar('demo', DEMO_EMAIL)
        users = {name: user_with_avatar(name, f'{name}@chat.app') for name in USERS}

        for name in FRIENDS:
            demo.friends.add(users[name])
            users[name].friends.add(demo)

        now = timezone.now()
        for name, messages in CONVERSATIONS:
            friend = users[name]
            conversation = Conversation.objects.create(user1=demo, user2=friend)
            for minutes_ago, from_demo, content in messages:
                message = Messages(conversation=conversation, sender=demo if from_demo else friend)
                if isinstance(content, tuple):
                    kind, file_name = content
                    with open(DEMO_DIR / file_name, 'rb') as f:
                        getattr(message, 'image' if kind == 'image' else 'files').save(file_name, File(f), save=False)
                else:
                    message.text = content
                message.save()
                # created_at is set automatically, so move it back afterwards
                Messages.objects.filter(pk=message.pk).update(created_at=now - timedelta(minutes=minutes_ago))

        self.stdout.write(self.style.SUCCESS(
            f'Added {len(USERS) + 1} users. Log in as {DEMO_EMAIL} / {PASSWORD}'))
