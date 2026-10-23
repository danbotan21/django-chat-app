from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from signup.serializer import PublicUserSerializer


class User(APIView):
    """Log in with email + password and get an API token."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        if user is None:
            return Response({'error': 'Wrong email or password.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': PublicUserSerializer(user).data})


class Me(APIView):
    def get(self, request):
        return Response(PublicUserSerializer(request.user).data)


class Logout(APIView):
    def post(self, request, *args, **kwargs):
        Token.objects.filter(user=request.user).delete()
        return Response({'message': 'Logged out.'})
