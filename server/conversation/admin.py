from django.contrib import admin
from .models import Conversation, Messages


admin.site.register(Conversation)
admin.site.register(Messages)

