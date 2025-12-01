from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmploymentViewSet, EmploymentStatusLogViewSet, EmploymentDepartmentRoleViewSet, PersonDepartmentRoleViewSet

router = DefaultRouter()
# Removemos las rutas de catálogos viejos (roles, employment-types, employment-statuses)
# Solo mantenemos employments y logs
router.register(r'employments', EmploymentViewSet, basename='employment')
router.register(r'status-logs', EmploymentStatusLogViewSet, basename='status-log')
router.register(r'department-roles', EmploymentDepartmentRoleViewSet,basename='department-role')
router.register(r'person-department-roles', PersonDepartmentRoleViewSet, basename='person-department-role')

urlpatterns = [
    path('', include(router.urls)),
]