import django
from django.db import models
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.models import AbstractUser
from django.db import models


class CreateUser(AbstractUser):
    email = models.EmailField(unique=True)
    confirm_password = models.CharField(max_length=128)
    user_picture = models.ImageField(upload_to='users_picture', blank=True)
    friends  = models.ManyToManyField('CreateUser', symmetrical=False, blank=True)

    
    
    
    groups = models.ManyToManyField(Group, related_name='createuser_groups', blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name='createuser_permissions', blank=True)
 
 
 