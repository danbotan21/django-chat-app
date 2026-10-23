import os

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChatApp.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from django.core.asgi import get_asgi_application  # noqa: E402

from ChatApp.ws_auth import TokenAuthMiddleware  # noqa: E402
from conversation.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': TokenAuthMiddleware(URLRouter(websocket_urlpatterns)),
})
