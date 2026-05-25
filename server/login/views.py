from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import PasswordResetTokenGenerator


from .serializer import LogInSerializer
from signup.models import CreateUser


class User(APIView):
    
    def generate_token(self, user):
        token_generator = PasswordResetTokenGenerator()
        return token_generator.make_token(user)
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', None)
        password = request.data.get('password', None)

        # Verifică dacă datele sunt furnizate
        if not email or not password:
            return Response({'error': 'Email și parolă sunt necesare'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verifică dacă utilizatorul există
            user = CreateUser.objects.get(email=email)
        except CreateUser.DoesNotExist:
            return Response({'error': 'Nu există un cont cu acest email'}, status=status.HTTP_404_NOT_FOUND)

        # Autentifică utilizatorul cu parola furnizată
        user = authenticate(request, email=email, password=password)
        if user is not None:
        
            login(request, user)
            
            token = self.generate_token(user)
            
            
            friends_data = user.friends.values('id', 'username', 'email', 'user_picture')
            
            
    
            # Construiește răspunsul JSON pentru succesul autentificării4
            response = {
                'message': 'Autentificare reușită',
                'username': user.username,
                'image': user.user_picture.url if user.user_picture else '',
                'userId': user.id,
                'friends': list(friends_data),
                'token': token,
            }

            return Response(response, status=status.HTTP_200_OK)
        else:
            # Dacă autentificarea a eșuat, returnează un mesaj de eroare
            return Response({'error': 'Emailul sau parola nu corespund   cu un cont valid'}, status=status.HTTP_401_UNAUTHORIZED)



class Logout(APIView):
    def post(self, request, *args, **kwargs):
            logout(request)
            return Response({'message': 'Deconectare reușită'}, status=status.HTTP_200_OK)
  
        
