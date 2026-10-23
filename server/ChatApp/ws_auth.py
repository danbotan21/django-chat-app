from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def user_from_token(key):
    from rest_framework.authtoken.models import Token
    token = Token.objects.select_related('user').filter(key=key).first()
    return token.user if token else AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """Browsers cannot set headers on a WebSocket, so the token comes as ?token=<key>."""

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get('query_string', b'').decode())
        key = (query.get('token') or [''])[0]
        scope['user'] = await user_from_token(key) if key else AnonymousUser()
        return await super().__call__(scope, receive, send)
