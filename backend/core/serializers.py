from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from django.utils import timezone
from datetime import date
import re 

from .models import (
    Person, Salutation, Gender, MaritalStatus, Country, Language, 
    LanguageProficiency, DisabilityGroup, DisabilityType, DisabilityStatus,
    PersonDisabilityVE, AddressType, State, Address, 
    NationalId, EmailType, PersonEmail, PhoneType, PhoneCarrier, 
    PhoneAreaCode, PersonPhone, Bank, BankAccountType, PersonBankAccount, 
    PersonDocument, RelationshipType, PersonNationality, 
    PersonLanguage, Dependent, EmergencyContact
)

# --- FUNCIONES DE UTILIDAD ---
def title_case_cleaner(value):
    if not value: return ""
    EXCLUSIONS = {'de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'en', 'a', 'por', 'con', 'para', 'sin', 'so', 'sobre'}
    words = value.strip().lower().split()
    if not words: return ""
    processed_words = [words[0].capitalize()]
    for word in words[1:]:
        if word in EXCLUSIONS:
            processed_words.append(word)
        else:
            processed_words.append(word.capitalize())
    return " ".join(processed_words)

def sentence_case_cleaner(value):
    return value.strip().capitalize()

def validate_only_letters(value, field_name):
    if not re.fullmatch(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", value):
        raise serializers.ValidationError(
            f"El campo '{field_name}' solo puede contener letras, espacios y tildes."
        )
    return value

def validate_single_primary(serializer_instance, validated_data, model, primary_field_name):
    is_primary = validated_data.get('is_primary', getattr(serializer_instance.instance, 'is_primary', False))
    person = validated_data.get('person')

    if is_primary:
        queryset = model.objects.filter(person=person, is_primary=True)
        if serializer_instance.instance:
            queryset = queryset.exclude(pk=serializer_instance.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({
                'is_primary': f"Ya existe un registro {primary_field_name} marcado como principal."
            })
    return validated_data

def check_uniqueness(model, field_name, value, instance=None, error_msg="Ya existe un registro con este valor."):
    filter_kwargs = {field_name: value}
    qs = model.objects.filter(**filter_kwargs)
    if instance:
        qs = qs.exclude(pk=instance.pk)
    if qs.exists():
        raise serializers.ValidationError(error_msg)
    return value


# --- Serializers de Catálogo ---
class SalutationSerializer(serializers.ModelSerializer):
    class Meta: model = Salutation; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(Salutation, 'name', title_case_cleaner(value), self.instance)
class GenderSerializer(serializers.ModelSerializer):
    class Meta: model = Gender; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(Gender, 'name', title_case_cleaner(value), self.instance)
class MaritalStatusSerializer(serializers.ModelSerializer):
    class Meta: model = MaritalStatus; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(MaritalStatus, 'name', title_case_cleaner(value), self.instance)

class CountrySerializer(serializers.ModelSerializer):
    class Meta: model = Country; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(Country, 'name', title_case_cleaner(value), self.instance)
    def validate_iso_2(self, value): return check_uniqueness(Country, 'iso_2', value.strip().upper(), self.instance)
    def validate_phone_prefix(self, value):
        val = value.strip().lstrip('+')
        if not val.isdigit(): raise serializers.ValidationError("Solo dígitos.")
        return check_uniqueness(Country, 'phone_prefix', '+' + val, self.instance)
class LanguageSerializer(serializers.ModelSerializer):
    
    class Meta: model = Language; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(Language, 'name', title_case_cleaner(value), self.instance)
class LanguageProficiencySerializer(serializers.ModelSerializer):
    class Meta: model = LanguageProficiency; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(LanguageProficiency, 'name', title_case_cleaner(value), self.instance)
class DisabilityGroupSerializer(serializers.ModelSerializer):
    class Meta: model = DisabilityGroup; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(DisabilityGroup, 'name', title_case_cleaner(value), self.instance)
class DisabilityTypeSerializer(serializers.ModelSerializer):
    class Meta: model = DisabilityType; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(DisabilityType, 'name', title_case_cleaner(value), self.instance)
class DisabilityStatusSerializer(serializers.ModelSerializer):
    class Meta: model = DisabilityStatus; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(DisabilityStatus, 'name', sentence_case_cleaner(value), self.instance)
class AddressTypeSerializer(serializers.ModelSerializer):
    class Meta: model = AddressType; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(AddressType, 'name', title_case_cleaner(value), self.instance)
class EmailTypeSerializer(serializers.ModelSerializer):
    class Meta: model = EmailType; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(EmailType, 'name', title_case_cleaner(value), self.instance)
class PhoneTypeSerializer(serializers.ModelSerializer):
    class Meta: model = PhoneType; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(PhoneType, 'name', title_case_cleaner(value), self.instance)
class PhoneCarrierSerializer(serializers.ModelSerializer):
    class Meta: model = PhoneCarrier; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(PhoneCarrier, 'name', title_case_cleaner(value), self.instance)
class BankSerializer(serializers.ModelSerializer):
    class Meta: model = Bank; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(Bank, 'name', title_case_cleaner(value), self.instance)
    def validate_code(self, value): return check_uniqueness(Bank, 'code', value.strip().upper(), self.instance)
class BankAccountTypeSerializer(serializers.ModelSerializer):
    class Meta: model = BankAccountType; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(BankAccountType, 'name', title_case_cleaner(value), self.instance)
class RelationshipTypeSerializer(serializers.ModelSerializer):
    class Meta: model = RelationshipType; fields = '__all__'
    def validate_name(self, value): return check_uniqueness(RelationshipType, 'name', title_case_cleaner(value), self.instance)
class StateSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    class Meta: model = State; fields = '__all__'
    def validate_name(self, value): return title_case_cleaner(value)
class PhoneAreaCodeSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    carrier_name = serializers.CharField(source='carrier.name', read_only=True)
    class Meta: model = PhoneAreaCode; fields = '__all__'

# --- SERIALIZERS PRINCIPALES ---

class NationalIdSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    full_document = serializers.SerializerMethodField()

    class Meta: 
        model = NationalId
        fields = '__all__'
        validators = [
            UniqueTogetherValidator(queryset=NationalId.objects.all(), fields=['document_type', 'number'], message="Este documento ya está registrado"),
            UniqueTogetherValidator(queryset=NationalId.objects.all(), fields=['person', 'category'], message="Documento ya está registrado para esta persona")
        ]
    
    def get_full_document(self, obj): return f"{obj.document_type}-{obj.number}"
    def validate_number(self, value):
        if not value.strip().isdigit(): raise serializers.ValidationError("El campo solo debe contener numeros")
        return value.strip()
    def validate(self, data): return validate_single_primary(self, data, NationalId, "ID Nacional")


class PersonEmailSerializer(serializers.ModelSerializer):
    email_type_name = serializers.CharField(source='email_type.name', read_only=True)

    class Meta: 
        model = PersonEmail
        fields = '__all__'
        # No se necesita el UniqueTogetherValidator porque email_address es unique=True 
        # y la restricción condicional es mejor manejarla en validate().
        # No se necesita 'validators = []'
    
    # 🚨 Restaurar la lógica de validación para is_primary
    def validate(self, data):
        # Obtener el valor de is_primary (nuevo o existente)
        is_primary = data.get('is_primary', getattr(self.instance, 'is_primary', False))
        # Obtener la instancia de Person
        person = data.get('person', getattr(self.instance, 'person', None)) 

        if is_primary and person:
            # Buscar otros correos que sean primary para esta persona
            queryset = PersonEmail.objects.filter(person=person, is_primary=True)
            
            # Excluir la instancia actual si estamos actualizando
            if self.instance: 
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                # Lanza el error de validación de DRF con un mensaje claro
                raise serializers.ValidationError(
                    {'is_primary': "Ya existe un Correo Electrónico principal para esta persona."}
                )
        
        return data


from rest_framework import serializers

class PersonPhoneSerializer(serializers.ModelSerializer):
    # Campos adicionales para presentación de datos
    phone_type_name = serializers.CharField(source='phone_type.name', read_only=True)
    full_number = serializers.SerializerMethodField()

    validators = [
            UniqueTogetherValidator(
                queryset=PersonPhone.objects.all(),
                fields=['area_code', 'subscriber_number'],
                message="Este número de teléfono ya se encuentra registrado." 
            )
        ]

    class Meta: 
        model = PersonPhone 
        fields = '__all__'

    def get_full_number(self, obj):
        if obj.area_code and obj.area_code.country:
            return f"{obj.area_code.country.phone_prefix} {obj.area_code.code} {obj.subscriber_number}"
        elif obj.area_code:
            return f"{obj.area_code.code} {obj.subscriber_number}"
        return obj.subscriber_number

    def validate_subscriber_number(self, value):
        if not value.isdigit() or len(value) > 10: 
            raise serializers.ValidationError("Número de abonado inválido (solo dígitos, máx 10).")
        return value
    
    def validate(self, data):
        is_primary = data.get('is_primary', getattr(self.instance, 'is_primary', False))
        person = data.get('person', getattr(self.instance, 'person', None))

        if is_primary and person:
            queryset = PersonPhone.objects.filter(person=person, is_primary=True)
            
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    {'is_primary': "Ya existe un teléfono principal"}
                )
        
        return data

# ... (El resto de serializers sigue igual) ...
class PersonListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    primary_document = serializers.SerializerMethodField()
    primary_email = serializers.SerializerMethodField()
    primary_phone = serializers.SerializerMethodField()
    class Meta:
        model = Person
        fields = ['id', 'photo', 'full_name', 'primary_document', 'primary_email', 'primary_phone']
    def get_full_name(self, obj): return f"{obj.first_name} {obj.paternal_surname}".strip()
    def get_primary_document(self, obj):
        doc = obj.national_ids.filter(is_primary=True).first()
        return f"{doc.category} {doc.document_type}-{doc.number}" if doc else "—"
    def get_primary_email(self, obj):
        email = obj.emails.filter(is_primary=True).first()
        return email.email_address if email else "—"
    def get_primary_phone(self, obj):
        phone = obj.phones.filter(is_primary=True).first()
        return f"({phone.area_code.code}) {phone.subscriber_number}" if phone else "—"

class PersonSerializer(serializers.ModelSerializer):
    class Meta: model = Person; fields = '__all__'
    def validate_birthdate(self, value):
        if value and value > date.today(): raise serializers.ValidationError("Fecha futura no permitida.")
        return value
    def validate_first_name(self, value): return title_case_cleaner(validate_only_letters(value, "Primer Nombre"))
    def validate_second_name(self, value): return title_case_cleaner(validate_only_letters(value, "Segundo Nombre")) if value else value
    def validate_paternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Paterno"))
    def validate_maternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Materno")) if value else value

class PersonDisabilityVESerializer(serializers.ModelSerializer):
    class Meta: model = PersonDisabilityVE; fields = '__all__'
    def validate(self, data):
        if data.get('date_learned') and data.get('date_of_determination') and data['date_learned'] > data['date_of_determination']:
            raise serializers.ValidationError({"date_learned": "Fecha inconsistente."})
        return data

class AddressSerializer(serializers.ModelSerializer):
    address_type_name = serializers.CharField(source='address_type.name', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)

    class Meta: model = Address; fields = '__all__'
    def validate(self, data):
        if data.get('state') and data.get('country') and data['state'].country != data['country']:
            raise serializers.ValidationError({"state": "El estado no pertenece al país seleccionado."})
        return data

class PersonBankAccountSerializer(serializers.ModelSerializer):
    class Meta: model = PersonBankAccount; fields = '__all__'
    def validate_account_number(self, value):
        if not value.isdigit() or len(value) != 20: raise serializers.ValidationError("Debe tener 20 dígitos.")
        return value
    def validate(self, data): return validate_single_primary(self, data, PersonBankAccount, "Cuenta Bancaria")

class PersonDocumentSerializer(serializers.ModelSerializer):
    class Meta: model = PersonDocument; fields = '__all__'

class PersonNationalitySerializer(serializers.ModelSerializer):
    class Meta: model = PersonNationality; fields = '__all__'

class PersonLanguageSerializer(serializers.ModelSerializer):
    class Meta: model = PersonLanguage; fields = '__all__'

class DependentSerializer(serializers.ModelSerializer):
    class Meta: model = Dependent; fields = '__all__'
    validators = [UniqueTogetherValidator(queryset=Dependent.objects.all(), fields=['person', 'first_name', 'paternal_surname'])]
    def validate_birthdate(self, value):
        if value > date.today(): raise serializers.ValidationError("Fecha futura.")
        return value
    def validate_first_name(self, value): return title_case_cleaner(validate_only_letters(value, "Nombre"))
    def validate_second_name(self, value): return title_case_cleaner(validate_only_letters(value, "Segundo Nombre")) if value else value
    def validate_paternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Paterno"))
    def validate_maternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Materno")) if value else value

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta: model = EmergencyContact; fields = '__all__'
    def validate_phone_number(self, value):
        if not value.isdigit(): raise serializers.ValidationError("Solo números.")
        return value
    def validate(self, data): return validate_single_primary(self, data, EmergencyContact, "Contacto")
    def validate_first_name(self, value): return title_case_cleaner(validate_only_letters(value, "Nombre"))
    def validate_second_name(self, value): return title_case_cleaner(validate_only_letters(value, "Segundo Nombre")) if value else value
    def validate_paternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Paterno"))
    def validate_maternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Materno")) if value else value