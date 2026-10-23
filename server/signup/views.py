from rest_framework import status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import CreateUser
from .serializer import SignupSerializer


class SignupView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        username = request.data.get('username')

        if email and CreateUser.objects.filter(email__iexact=email).exists():
            return Response({'error': 'An account with this email already exists.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if username and CreateUser.objects.filter(username__iexact=username).exists():
            return Response({'error': 'This username is already taken.'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Account created.'}, status=status.HTTP_201_CREATED)

        # first validation message of the first invalid field, e.g. "This password is too short."
        field, messages = next(iter(serializer.errors.items()))
        return Response({'error': messages[0], 'field': field}, status=status.HTTP_400_BAD_REQUEST)
