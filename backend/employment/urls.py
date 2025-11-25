from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, EmploymentTypeViewSet, EmploymentStatusViewSet, 
    EmploymentViewSet, EmploymentStatusLogViewSet # <--- NOMBRE CORREGIDO
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'employment-types', EmploymentTypeViewSet, basename='employmenttype')
router.register(r'employment-statuses', EmploymentStatusViewSet, basename='employmentstatus')
router.register(r'employments', EmploymentViewSet, basename='employment')

# Mantenemos la URL 'employment-status-history' para no romper el frontend, 
# pero usamos la vista correcta
router.register(r'employment-status-history', EmploymentStatusLogViewSet, basename='employmentstatuslog')

urlpatterns = [
    path('', include(router.urls)),
]