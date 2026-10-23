from django.urls import path
from .views import SignupView


urlpatterns = [
    path('create-users/', SignupView.as_view(), name='create-users'),
]
