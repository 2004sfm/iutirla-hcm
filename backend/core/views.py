from rest_framework import viewsets, permissions
from .models import (
    Person, Salutation, Gender, MaritalStatus, Country, Language, 
    LanguageProficiency, DisabilityGroup, DisabilityType, DisabilityStatus,
    PersonDisabilityVE, AddressType, State, Address, 
    NationalId, EmailType, PersonEmail, PhoneType, PhoneCarrier, 
    PhoneAreaCode, PersonPhone, Bank, BankAccountType, PersonBankAccount, 
    PersonDocument, RelationshipType, PersonNationality, 
    PersonLanguage, Dependent, EmergencyContact
)
from .serializers import (
    PersonSerializer, PersonListSerializer, SalutationSerializer, GenderSerializer, MaritalStatusSerializer, 
    CountrySerializer, LanguageSerializer, LanguageProficiencySerializer, 
    DisabilityGroupSerializer, DisabilityTypeSerializer, DisabilityStatusSerializer,
    PersonDisabilityVESerializer, AddressTypeSerializer, StateSerializer, 
    AddressSerializer, NationalIdSerializer, 
    EmailTypeSerializer, PersonEmailSerializer, PhoneTypeSerializer, 
    PhoneCarrierSerializer, PhoneAreaCodeSerializer, PersonPhoneSerializer, 
    BankSerializer, BankAccountTypeSerializer, PersonBankAccountSerializer, 
    PersonDocumentSerializer, RelationshipTypeSerializer, 
    PersonNationalitySerializer, PersonLanguageSerializer, 
    DependentSerializer, EmergencyContactSerializer
)

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list': return PersonListSerializer
        return PersonSerializer

class NationalIdViewSet(viewsets.ModelViewSet):
    serializer_class = NationalIdSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = NationalId.objects.all()
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person=person_id)
        return queryset

# ... (Resto de ViewSets de Catálogos igual) ...
class SalutationViewSet(viewsets.ModelViewSet):
    queryset = Salutation.objects.all()
    serializer_class = SalutationSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class GenderViewSet(viewsets.ModelViewSet):
    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class MaritalStatusViewSet(viewsets.ModelViewSet):
    queryset = MaritalStatus.objects.all()
    serializer_class = MaritalStatusSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class LanguageProficiencyViewSet(viewsets.ModelViewSet):
    queryset = LanguageProficiency.objects.all()
    serializer_class = LanguageProficiencySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class DisabilityGroupViewSet(viewsets.ModelViewSet):
    queryset = DisabilityGroup.objects.all()
    serializer_class = DisabilityGroupSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class DisabilityTypeViewSet(viewsets.ModelViewSet):
    queryset = DisabilityType.objects.all()
    serializer_class = DisabilityTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class DisabilityStatusViewSet(viewsets.ModelViewSet):
    queryset = DisabilityStatus.objects.all()
    serializer_class = DisabilityStatusSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class AddressTypeViewSet(viewsets.ModelViewSet):
    queryset = AddressType.objects.all()
    serializer_class = AddressTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class EmailTypeViewSet(viewsets.ModelViewSet):
    queryset = EmailType.objects.all()
    serializer_class = EmailTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class PhoneTypeViewSet(viewsets.ModelViewSet):
    queryset = PhoneType.objects.all()
    serializer_class = PhoneTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class PhoneCarrierViewSet(viewsets.ModelViewSet):
    queryset = PhoneCarrier.objects.all()
    serializer_class = PhoneCarrierSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class BankViewSet(viewsets.ModelViewSet):
    queryset = Bank.objects.all()
    serializer_class = BankSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class BankAccountTypeViewSet(viewsets.ModelViewSet):
    queryset = BankAccountType.objects.all()
    serializer_class = BankAccountTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class RelationshipTypeViewSet(viewsets.ModelViewSet):
    queryset = RelationshipType.objects.all()
    serializer_class = RelationshipTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class StateViewSet(viewsets.ModelViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
class PhoneAreaCodeViewSet(viewsets.ModelViewSet):
    queryset = PhoneAreaCode.objects.all()
    serializer_class = PhoneAreaCodeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

# --- ViewSets de Datos de Person ---
class PersonDisabilityVEViewSet(viewsets.ModelViewSet):
    queryset = PersonDisabilityVE.objects.all()
    serializer_class = PersonDisabilityVESerializer
    permission_classes = [permissions.IsAuthenticated]
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Address.objects.filter(person=self.request.query_params.get('person')) if self.request.query_params.get('person') else Address.objects.all()
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
class PersonDocumentViewSet(viewsets.ModelViewSet):
    queryset = PersonDocument.objects.all()
    serializer_class = PersonDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
class PersonNationalityViewSet(viewsets.ModelViewSet):
    queryset = PersonNationality.objects.all()
    serializer_class = PersonNationalitySerializer
    permission_classes = [permissions.IsAuthenticated]
class PersonLanguageViewSet(viewsets.ModelViewSet):
    queryset = PersonLanguage.objects.all()
    serializer_class = PersonLanguageSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- VIEWSETS SATÉLITES ---
class DependentViewSet(viewsets.ModelViewSet):
    queryset = Dependent.objects.all()
    serializer_class = DependentSerializer
    permission_classes = [permissions.IsAuthenticated]
class EmergencyContactViewSet(viewsets.ModelViewSet):
    queryset = EmergencyContact.objects.all()
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]