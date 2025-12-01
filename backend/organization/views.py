from rest_framework import viewsets, permissions
from .models import Department, JobTitle, Position, PositionRequirement, PositionFunction
from .serializers import DepartmentSerializer, JobTitleSerializer, PositionSerializer, PositionRequirementSerializer, PositionFunctionSerializer

from core.filters import UnaccentSearchFilter

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']

class JobTitleViewSet(viewsets.ModelViewSet):
    queryset = JobTitle.objects.all()
    serializer_class = JobTitleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']

from django_filters.rest_framework import DjangoFilterBackend

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all().select_related('department', 'job_title').prefetch_related('manager_positions', 'manager_positions__job_title', 'manager_positions__department')
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, UnaccentSearchFilter]
    filterset_fields = ['department']
    search_fields = ['job_title__name', 'department__name']

class PositionRequirementViewSet(viewsets.ModelViewSet):
    serializer_class = PositionRequirementSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        position_id = self.kwargs.get('position_pk')
        if position_id:
            return PositionRequirement.objects.filter(position_id=position_id)
        return PositionRequirement.objects.all()
    
    def perform_create(self, serializer):
        position_id = self.kwargs.get('position_pk')
        serializer.save(position_id=position_id)

class PositionFunctionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionFunctionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['position']
    
    def get_queryset(self):
        position_id = self.kwargs.get('position_pk')
        if position_id:
            return PositionFunction.objects.filter(position_id=position_id)
        return PositionFunction.objects.all()
    
    def perform_create(self, serializer):
        position_id = self.kwargs.get('position_pk')
        serializer.save(position_id=position_id)