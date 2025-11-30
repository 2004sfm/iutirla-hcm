from rest_framework import viewsets, permissions
from .models import Department, JobTitle, Position, PositionObjective, PositionRequirement, PositionFunction
from .serializers import DepartmentSerializer, JobTitleSerializer, PositionSerializer, PositionObjectiveSerializer, PositionRequirementSerializer, PositionFunctionSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class JobTitleViewSet(viewsets.ModelViewSet):
    queryset = JobTitle.objects.all()
    serializer_class = JobTitleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

from django_filters.rest_framework import DjangoFilterBackend

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department']

class PositionObjectiveViewSet(viewsets.ModelViewSet):
    serializer_class = PositionObjectiveSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        position_id = self.kwargs.get('position_pk')
        if position_id:
            return PositionObjective.objects.filter(position_id=position_id)
        return PositionObjective.objects.all()
    
    def perform_create(self, serializer):
        position_id = self.kwargs.get('position_pk')
        serializer.save(position_id=position_id)

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