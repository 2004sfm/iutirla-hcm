from rest_framework import viewsets, permissions
from .models import (
    Role, EmploymentType, EmploymentStatus, 
    Employment, EmploymentStatusHistory
)
from .serializers import (
    RoleSerializer, EmploymentTypeSerializer, EmploymentStatusSerializer, 
    EmploymentSerializer, EmploymentStatusHistorySerializer
)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EmploymentTypeViewSet(viewsets.ModelViewSet):
    queryset = EmploymentType.objects.all()
    serializer_class = EmploymentTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EmploymentStatusViewSet(viewsets.ModelViewSet):
    queryset = EmploymentStatus.objects.all()
    serializer_class = EmploymentStatusSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EmploymentViewSet(viewsets.ModelViewSet):
    queryset = Employment.objects.all()
    serializer_class = EmploymentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EmploymentStatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = EmploymentStatusHistory.objects.all()
    serializer_class = EmploymentStatusHistorySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
