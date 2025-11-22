from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = (
        'username',
        'person',
        'is_staff',
        'is_active'
        )
    search_fields = (
        'username', 
        'person__first_name', 
        'person__paternal_surname'
        )
    list_filter = (
        'is_staff',
        'is_active',
        'is_superuser'
        )
    fieldsets = (
        (
            None, 
            {
                'fields': (
                'username',
                'password'
                )
            }
        ),
        (
            'Personal info', 
            {
                'fields': (
                'person',
                )
            }
        ),
        (
            'Permissions', 
            {
                'fields': (
                    'is_active',
                    'is_staff', 
                    'is_superuser', 
                    'groups', 
                    'user_permissions'
                )
            }
            ),
        (
            'Important dates', 
            {
                'fields': (
                    'last_login', 
                    'created_at'
                )
            }
        ),
    )
    readonly_fields = (
        'last_login', 
        'created_at', 
        'updated_at'
        )

admin.site.register(User, CustomUserAdmin)