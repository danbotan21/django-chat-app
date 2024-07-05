from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework import status, views, permissions, generics
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from .serializer import SignupSerializer
from .models import CreateUser

class SignupView(views.APIView):
    serializer_class = SignupSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', None)
        username = request.data.get('username', None)
        password = request.data.get('password', None)
        confirm_password = request.data.get('confirm_password', None)
        
    
        if email and CreateUser.objects.filter(email=email).exists():
            return Response(
                {"error": "Email-ul există deja și nu poate fi utilizat pentru înregistrare."},
                status=status.HTTP_400_BAD_REQUEST
            )


        if username and CreateUser.objects.filter(username=username).exists():
            return Response(
                {"error": "Numele de utilizator există deja și nu poate fi utilizat pentru înregistrare."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
            
        if password != confirm_password :
            return Response(
                {"error": "Parola si confirmarea ei nu sunt la fel"},
                status=status.HTTP_400_BAD_REQUEST
            )

 
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            # Serializerul salvează automat datele după validare
            serializer.save()

            return Response(
                {"message": "Utilizatorul a fost creat cu succes."},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        # Fetch all users using the model manager
        users = CreateUser.objects.all()

        # Create a serializer instance with the fetched data (no queryset argument)
        serializer = self.serializer_class(users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
