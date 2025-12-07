from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Exists, OuterRef
from django.db import transaction
from .models import User
from .serializers import UserReadSerializer, EmployeeCreationSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('person')
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreationSerializer
        return UserReadSerializer

    @action(detail=False, methods=['get'])
    def check_pending_accounts(self, request):
        """
        Verifica si hay empleados activos sin cuenta de usuario.
        Retorna: { has_pending: bool, count: int }
        """
        from employment.models import Employment, is_active_status
        from core.models import Person
        
        # Obtener personas con contratos activos
        active_employments = Employment.objects.filter(
            current_status__in=['ACT', 'SUS', 'PER', 'REP']
        ).values_list('person_id', flat=True).distinct()
        
        # Filtrar las que NO tienen cuenta
        persons_without_account = Person.objects.filter(
            id__in=active_employments
        ).filter(
            user_account__isnull=True
        )
        
        count = persons_without_account.count()
        
        return Response({
            'has_pending': count > 0,
            'count': count
        })

    @action(detail=False, methods=['post'])
    def bulk_create_employee_accounts(self, request):
        """
        Crea cuentas de usuario para todos los empleados activos que no tienen cuenta.
        Username y password inicial = cédula (número del documento)
        """
        from employment.models import Employment
        from core.models import Person, NationalId
        
        created_accounts = []
        errors = []
        
        with transaction.atomic():
            # 1. Obtener personas con contratos activos
            active_person_ids = Employment.objects.filter(
                current_status__in=['ACT', 'SUS', 'PER', 'REP']
            ).values_list('person_id', flat=True).distinct()
            
            # 2. Filtrar las que NO tienen cuenta
            persons_without_account = Person.objects.filter(
                id__in=active_person_ids,
                user_account__isnull=True
            ).select_related('gender', 'marital_status')
            
            # 3. Crear cuentas
            for person in persons_without_account:
                try:
                    # Obtener cédula principal
                    national_id = person.national_ids.filter(
                        category='CEDULA',
                        is_primary=True
                    ).first()
                    
                    if not national_id:
                        errors.append({
                            'person_id': person.id,
                            'person_name': str(person),
                            'error': 'No tiene cédula registrada'
                        })
                        continue
                    
                    # Extraer número de cédula limpio
                    cedula_number = national_id.number.replace('.', '').replace('-', '').strip()
                    
                    # Generar username: Primera Letra Nombre + Primer Apellido + Últimos 4 dígitos Cédula
                    import unicodedata
                    def normalize_text(text):
                        return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()
                    
                    first_initial = normalize_text(person.first_name[0])
                    surname = normalize_text(person.paternal_surname)
                    last_4_digits = cedula_number[-4:].zfill(4)
                    
                    base_username = f"{first_initial}{surname}{last_4_digits}"
                    username = base_username
                    
                    # Manejo de colisiones
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    # Crear usuario
                    user = User.objects.create_user(
                        username=username,
                        password=cedula_number,  # Password inicial = cédula
                        person=person,
                        is_active=True,
                        is_staff=False
                    )
                    
                    created_accounts.append({
                        'person_id': person.id,
                        'person_name': str(person),
                        'username': username
                    })
                    
                except Exception as e:
                    errors.append({
                        'person_id': person.id,
                        'person_name': str(person),
                        'error': str(e)
                    })
        
        return Response({
            'created_count': len(created_accounts),
            'error_count': len(errors),
            'created_accounts': created_accounts,
            'errors': errors
        })