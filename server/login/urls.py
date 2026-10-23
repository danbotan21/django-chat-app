from django.urls import path
from .views import User, Me, Logout


urlpatterns = [
    path('login/', User.as_view(), name='login'),
    path('me/', Me.as_view(), name='me'),
    path('log-out/', Logout.as_view(), name='logout'),
]
