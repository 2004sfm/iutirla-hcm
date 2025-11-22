from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'persons', views.PersonViewSet, basename='person')

# Catálogos
router.register(r'salutations', views.SalutationViewSet)
router.register(r'genders', views.GenderViewSet)
router.register(r'marital-statuses', views.MaritalStatusViewSet)
router.register(r'countries', views.CountryViewSet)
router.register(r'languages', views.LanguageViewSet)
router.register(r'language-proficiencies', views.LanguageProficiencyViewSet)
router.register(r'disability-groups', views.DisabilityGroupViewSet)
router.register(r'disability-types', views.DisabilityTypeViewSet)
router.register(r'disability-statuses', views.DisabilityStatusViewSet)
router.register(r'address-types', views.AddressTypeViewSet)
router.register(r'email-types', views.EmailTypeViewSet)
router.register(r'phone-types', views.PhoneTypeViewSet)
router.register(r'phone-carriers', views.PhoneCarrierViewSet)
router.register(r'banks', views.BankViewSet)
router.register(r'bank-account-types', views.BankAccountTypeViewSet)
router.register(r'relationship-types', views.RelationshipTypeViewSet)
router.register(r'states', views.StateViewSet)
router.register(r'phone-area-codes', views.PhoneAreaCodeViewSet)

# Datos de Persona
router.register(r'person-disabilities', views.PersonDisabilityVEViewSet)
router.register(r'addresses', views.AddressViewSet)
router.register(r'national-ids', views.NationalIdViewSet, basename='national-id')
router.register(r'person-emails', views.PersonEmailViewSet)
router.register(r'person-phones', views.PersonPhoneViewSet)
router.register(r'person-bank-accounts', views.PersonBankAccountViewSet)
router.register(r'person-documents', views.PersonDocumentViewSet)
router.register(r'person-nationalities', views.PersonNationalityViewSet)
router.register(r'person-languages', views.PersonLanguageViewSet)

# Rutas Satélites
router.register(r'dependents', views.DependentViewSet)
router.register(r'emergency-contacts', views.EmergencyContactViewSet)

urlpatterns = [
    path('', include(router.urls)),
]