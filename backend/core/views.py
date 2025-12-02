from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, permissions, filters
from .models import (
    Person, Gender, MaritalStatus, Country,
    DisabilityGroup, DisabilityType, DisabilityStatus,
    PersonDisabilityVE, AddressType, State, Address, 
    NationalId, EmailType, PersonEmail, PhoneType, PhoneCarrier, 
    PhoneCarrierCode, PersonPhone, Bank, BankAccountType, PersonBankAccount, 
    PersonDocument, RelationshipType, PersonNationality, 
    Dependent, EmergencyContact
)
from .serializers import (
    PersonSerializer, PersonListSerializer, GenderSerializer, MaritalStatusSerializer, 
    CountrySerializer,
    DisabilityGroupSerializer, DisabilityTypeSerializer, DisabilityStatusSerializer,
    PersonDisabilityVESerializer, AddressTypeSerializer, StateSerializer, 
    AddressSerializer, NationalIdSerializer, 
    EmailTypeSerializer, PersonEmailSerializer, PhoneTypeSerializer, 
    PhoneCarrierSerializer, PhoneCarrierCodeSerializer, PersonPhoneSerializer, 
    BankSerializer, BankAccountTypeSerializer, PersonBankAccountSerializer, 
    PersonDocumentSerializer, RelationshipTypeSerializer, 
    PersonNationalitySerializer,
    DependentSerializer, EmergencyContactSerializer
)
from .filters import UnaccentSearchFilter

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['first_name__unaccent', 'paternal_surname__unaccent', 'national_ids__number']

    def get_serializer_class(self):
        if self.action == 'list': return PersonListSerializer
        return PersonSerializer

    # FIX: Sobrescribimos get_queryset para permitir filtros avanzados
    def get_queryset(self):
        queryset = Person.objects.all().order_by('-created_at')
        
        # Filtro para el modal de contratación: Solo personas CON Cédula/ID
        if self.request.query_params.get('has_id') == 'true':
            queryset = queryset.filter(national_ids__isnull=False).distinct()
            
        return queryset

    @action(detail=True, methods=['post'], url_path='create-user-account')
    def create_user_account(self, request, pk=None):
        person = self.get_object()
        
        # 1. Validar si ya tiene usuario
        if hasattr(person, 'user_account') and person.user_account:
            return Response(
                {"error": "Esta persona ya tiene un usuario asignado."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        password = request.data.get('password')
        if not password:
            return Response(
                {"error": "La contraseña es obligatoria."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Generar Username: Primera Letra Nombre + Primer Apellido + Últimos 4 dígitos Cédula
        # Normalizamos para quitar acentos y caracteres especiales
        import unicodedata
        def normalize_text(text):
            return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

        first_initial = normalize_text(person.first_name[0])
        surname = normalize_text(person.paternal_surname)
        
        # Obtener cédula (documento principal)
        primary_doc = person.national_ids.filter(is_primary=True).first()
        if not primary_doc:
             return Response(
                {"error": "La persona debe tener un documento de identidad principal (Cédula) para generar el usuario."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Extraer últimos 4 dígitos, rellenar con 0 si es muy corta (raro en cédulas pero por seguridad)
        doc_number = primary_doc.number.replace('.', '').replace('-', '').strip()
        last_4_digits = doc_number[-4:].zfill(4)
        
        base_username = f"{first_initial}{surname}{last_4_digits}"
        username = base_username
        
        # 3. Manejo de colisiones (aunque la fórmula es bastante única)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        # 4. Crear Usuario
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                person=person,
                is_active=True
            )
            return Response({
                "message": "Usuario creado exitosamente.",
                "username": username,
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": f"Error al crear usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        person = self.get_object()
        
        if not hasattr(person, 'user_account') or not person.user_account:
            return Response(
                {"error": "Esta persona no tiene un usuario asignado."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        password = request.data.get('password')
        if not password:
            return Response(
                {"error": "La contraseña es obligatoria."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = person.user_account
            user.set_password(password)
            user.save()
            return Response({
                "message": "Contraseña actualizada exitosamente."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar contraseña: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='deactivate-user')
    def deactivate_user(self, request, pk=None):
        person = self.get_object()
        
        if not hasattr(person, 'user_account') or not person.user_account:
            return Response(
                {"error": "Esta persona no tiene un usuario asignado."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = person.user_account
            user.is_active = False
            user.save()
            return Response({
                "message": "Usuario desactivado exitosamente."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al desactivar usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='activate-user')
    def activate_user(self, request, pk=None):
        person = self.get_object()
        
        if not hasattr(person, 'user_account') or not person.user_account:
            return Response(
                {"error": "Esta persona no tiene un usuario asignado."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = person.user_account
            user.is_active = True
            user.save()
            return Response({
                "message": "Usuario activado exitosamente."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al activar usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class NationalIdViewSet(viewsets.ModelViewSet):
    serializer_class = NationalIdSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['number', 'person__first_name__unaccent', 'person__paternal_surname__unaccent']
    
    def get_queryset(self):
        queryset = NationalId.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset

# ... (Resto de ViewSets de Catálogos igual) ...
class GenderViewSet(viewsets.ModelViewSet):
    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class MaritalStatusViewSet(viewsets.ModelViewSet):
    queryset = MaritalStatus.objects.all()
    serializer_class = MaritalStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name', 'iso_2']

class DisabilityGroupViewSet(viewsets.ModelViewSet):
    queryset = DisabilityGroup.objects.all()
    serializer_class = DisabilityGroupSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class DisabilityTypeViewSet(viewsets.ModelViewSet):
    queryset = DisabilityType.objects.all()
    serializer_class = DisabilityTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class DisabilityStatusViewSet(viewsets.ModelViewSet):
    queryset = DisabilityStatus.objects.all()
    serializer_class = DisabilityStatusSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class AddressTypeViewSet(viewsets.ModelViewSet):
    queryset = AddressType.objects.all()
    serializer_class = AddressTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class EmailTypeViewSet(viewsets.ModelViewSet):
    queryset = EmailType.objects.all()
    serializer_class = EmailTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class PhoneTypeViewSet(viewsets.ModelViewSet):
    queryset = PhoneType.objects.all()
    serializer_class = PhoneTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class PhoneCarrierViewSet(viewsets.ModelViewSet):
    queryset = PhoneCarrier.objects.all()
    serializer_class = PhoneCarrierSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class BankViewSet(viewsets.ModelViewSet):
    queryset = Bank.objects.all()
    serializer_class = BankSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name', 'code']
class BankAccountTypeViewSet(viewsets.ModelViewSet):
    queryset = BankAccountType.objects.all()
    serializer_class = BankAccountTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class RelationshipTypeViewSet(viewsets.ModelViewSet):
    queryset = RelationshipType.objects.all()
    serializer_class = RelationshipTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
class StateViewSet(viewsets.ModelViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name', 'country__name']
class PhoneCarrierCodeViewSet(viewsets.ModelViewSet):
    queryset = PhoneCarrierCode.objects.all()
    serializer_class = PhoneCarrierCodeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['code', 'carrier__name']

# --- ViewSets de Datos de Person ---
class PersonDisabilityVEViewSet(viewsets.ModelViewSet):
    queryset = PersonDisabilityVE.objects.all()
    serializer_class = PersonDisabilityVESerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['person__first_name', 'person__paternal_surname', 'disability_type__name', 'disability_status__name']

    def get_queryset(self):
        queryset = PersonDisabilityVE.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = Address.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
    
class PersonEmailViewSet(viewsets.ModelViewSet):
    queryset = PersonEmail.objects.all()
    serializer_class = PersonEmailSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = PersonEmail.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
class PersonPhoneViewSet(viewsets.ModelViewSet):
    queryset = PersonPhone.objects.all()
    serializer_class = PersonPhoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = PersonPhone.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
    
class PersonBankAccountViewSet(viewsets.ModelViewSet):
    queryset = PersonBankAccount.objects.all()
    serializer_class = PersonBankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PersonBankAccount.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
class PersonDocumentViewSet(viewsets.ModelViewSet):
    queryset = PersonDocument.objects.all()
    serializer_class = PersonDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PersonDocument.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
class PersonNationalityViewSet(viewsets.ModelViewSet):
    queryset = PersonNationality.objects.all()
    serializer_class = PersonNationalitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PersonNationality.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset

# --- VIEWSETS SATÉLITES ---
class DependentViewSet(viewsets.ModelViewSet):
    queryset = Dependent.objects.all()
    serializer_class = DependentSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = Dependent.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset

class EmergencyContactViewSet(viewsets.ModelViewSet):
    queryset = EmergencyContact.objects.all()
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = EmergencyContact.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset
    