import shutil
import tempfile

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from ChatApp.asgi import application
from signup.models import CreateUser
from .models import Conversation, Messages

MEDIA = tempfile.mkdtemp()
PASSWORD = 'SafePass123!'


def make_user(name):
    return CreateUser.objects.create_user(username=name, email=f'{name}@test.dev', password=PASSWORD)


def make_friends(a, b):
    a.friends.add(b)
    b.friends.add(a)
    return Conversation.objects.create(user1=a, user2=b)


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_then_login_returns_a_token(self):
        response = self.client.post('/signup/create-users/', {
            'username': 'newuser', 'email': 'new@test.dev',
            'password': PASSWORD, 'confirm_password': PASSWORD,
        })
        self.assertEqual(response.status_code, 201)

        response = self.client.post('/auth/login/', {'email': 'new@test.dev', 'password': PASSWORD})
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertNotIn('password', response.data['user'])

    def test_signup_rejects_mismatched_passwords(self):
        response = self.client.post('/signup/create-users/', {
            'username': 'newuser', 'email': 'new@test.dev',
            'password': PASSWORD, 'confirm_password': 'Different123!',
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Passwords do not match.')

    def test_signup_rejects_a_taken_email(self):
        make_user('ana')
        response = self.client.post('/signup/create-users/', {
            'username': 'other', 'email': 'ANA@test.dev',
            'password': PASSWORD, 'confirm_password': PASSWORD,
        })
        self.assertEqual(response.status_code, 400)

    def test_wrong_password(self):
        make_user('ana')
        response = self.client.post('/auth/login/', {'email': 'ana@test.dev', 'password': 'nope'})
        self.assertEqual(response.status_code, 401)

    def test_api_needs_a_token(self):
        self.assertEqual(self.client.get('/conversation/friends/').status_code, 401)

    def test_logout_deletes_the_token(self):
        user = make_user('ana')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        self.client.post('/auth/log-out/')
        self.assertFalse(Token.objects.filter(user=user).exists())


@override_settings(MEDIA_ROOT=MEDIA)
class ConversationTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        self.ana, self.bob, self.eve = make_user('ana'), make_user('bob'), make_user('eve')
        self.client = APIClient()
        self.client.force_authenticate(self.ana)

    def test_add_friend_works_both_ways_and_opens_a_conversation(self):
        response = self.client.post('/conversation/friends/', {'friendId': self.bob.id})
        self.assertEqual(response.status_code, 201)
        self.assertTrue(self.bob.friends.filter(id=self.ana.id).exists())
        self.assertIsNotNone(Conversation.between(self.ana, self.bob))

        # adding again does not create a second conversation
        self.client.post('/conversation/friends/', {'friendId': self.bob.id})
        self.assertEqual(Conversation.objects.count(), 1)

    def test_find_users_skips_me_and_my_friends(self):
        make_friends(self.ana, self.bob)
        response = self.client.get('/conversation/users/')
        self.assertEqual([u['username'] for u in response.data], ['eve'])

    def test_friend_list_shows_the_last_message(self):
        conversation = make_friends(self.ana, self.bob)
        Messages.objects.create(text='first', sender=self.bob, conversation=conversation)
        Messages.objects.create(text='second', sender=self.ana, conversation=conversation)

        response = self.client.get('/conversation/friends/')
        self.assertEqual(response.data[0]['last_message']['text'], 'second')

    def test_cannot_read_a_stranger_conversation(self):
        make_friends(self.bob, self.eve)
        response = self.client.get('/conversation/', {'friendUserId': self.eve.id})
        self.assertEqual(response.status_code, 404)

    def test_send_and_read_messages(self):
        make_friends(self.ana, self.bob)
        self.client.post('/conversation/send-message/', {'friendUserId': self.bob.id, 'sendMessage': 'hello'})

        response = self.client.get('/conversation/', {'friendUserId': self.bob.id})
        self.assertEqual([m['text'] for m in response.data['messages']], ['hello'])
        self.assertNotIn('password', response.data['messages'][0]['user'])

    def test_send_a_file(self):
        make_friends(self.ana, self.bob)
        upload = SimpleUploadedFile('notes.txt', b'hello', content_type='text/plain')
        response = self.client.post('/conversation/send-file/', {'friendUserId': self.bob.id, 'file': upload})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['file_name'], 'notes.txt')

    def test_image_endpoint_rejects_other_files(self):
        make_friends(self.ana, self.bob)
        upload = SimpleUploadedFile('notes.txt', b'hello', content_type='text/plain')
        response = self.client.post('/conversation/send-image/', {'friendUserId': self.bob.id, 'image': upload})
        self.assertEqual(response.status_code, 400)


class WebSocketTests(TransactionTestCase):
    def setUp(self):
        self.ana, self.bob, self.eve = make_user('ana'), make_user('bob'), make_user('eve')
        make_friends(self.ana, self.bob)
        self.tokens = {u.username: Token.objects.create(user=u).key for u in (self.ana, self.bob, self.eve)}

    def connect(self, name, friend):
        return WebsocketCommunicator(application, f'/ws/chat/{friend.id}/?token={self.tokens[name]}')

    def test_message_reaches_the_friend(self):
        async def scenario():
            ana, bob = self.connect('ana', self.bob), self.connect('bob', self.ana)
            self.assertTrue((await ana.connect())[0])
            self.assertTrue((await bob.connect())[0])

            await ana.send_json_to({'type': 'message', 'message': 'hi bob'})
            received = await bob.receive_json_from()
            self.assertEqual(received['text'], 'hi bob')
            self.assertEqual(received['sender'], self.ana.id)

            await ana.disconnect()
            await bob.disconnect()

        async_to_sync(scenario)()
        self.assertEqual(Messages.objects.get().text, 'hi bob')

    def test_strangers_and_anonymous_users_are_refused(self):
        async def scenario():
            eve = self.connect('eve', self.ana)
            self.assertFalse((await eve.connect())[0])
            anonymous = WebsocketCommunicator(application, f'/ws/chat/{self.ana.id}/')
            self.assertFalse((await anonymous.connect())[0])

        async_to_sync(scenario)()
