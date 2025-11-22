from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserReadSerializer, EmployeeCreationSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('person')
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreationSerializer
        return UserReadSerializer