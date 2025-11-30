from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/core/', include('core.urls')),
    path('api/organization/', include('organization.urls')),
    path('api/employment/', include('employment.urls')),
    path('api/talent/', include('talent.urls')),
    path('api/training/', include('training.urls')),
    path('api/performance/', include('performance.urls')),
    path('api/ats/', include('ats.urls')),  # ATS: incluye /public y admin
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)