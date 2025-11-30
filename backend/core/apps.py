from django.apps import AppConfig
from django.db.backends.signals import connection_created
from django.db.models import Transform
from django.db.models import CharField, TextField

class Unaccent(Transform):
    lookup_name = 'unaccent'
    function = 'unaccent'

def register_sqlite_functions(sender, connection, **kwargs):
    if connection.vendor == 'sqlite':
        from .db_utils import remove_accents
        connection.connection.create_function("unaccent", 1, remove_accents)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        connection_created.connect(register_sqlite_functions)
        CharField.register_lookup(Unaccent)
        TextField.register_lookup(Unaccent)
