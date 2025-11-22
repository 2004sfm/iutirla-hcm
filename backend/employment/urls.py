from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, EmploymentTypeViewSet, EmploymentStatusViewSet, 
    EmploymentViewSet, EmploymentStatusHistoryViewSet
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'employment-types', EmploymentTypeViewSet, basename='employmenttype')
router.register(r'employment-statuses', EmploymentStatusViewSet, basename='employmentstatus')
router.register(r'employments', EmploymentViewSet, basename='employment')
router.register(r'employment-status-history', EmploymentStatusHistoryViewSet, basename='employmentstatushistory')

urlpatterns = [
    path('', include(router.urls)),
]