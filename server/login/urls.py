from django.urls import path, include
from .views import User, Logout


urlpatterns = [
    path('login/', User.as_view(), name='User'),
    path('log-out/', Logout.as_view(), name='LogOut')
]
