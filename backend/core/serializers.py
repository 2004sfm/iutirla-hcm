from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from datetime import date
import re 

from .models import (
    Person, Salutation, Gender, MaritalStatus, Country, 
    DisabilityGroup, DisabilityType, DisabilityStatus,
    PersonDisabilityVE, AddressType, State, Address, 
    NationalId, EmailType, PersonEmail, PhoneType, PhoneCarrier, 
    PhoneCarrierCode, PersonPhone, Bank, BankAccountType, PersonBankAccount, 
    PersonDocument, RelationshipType, PersonNationality, 
    Dependent, EmergencyContact
)

# --- FUNCIONES DE UTILIDAD ---
def title_case_cleaner(value):
    if not value: return ""
    EXCLUSIONS = {'de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'en', 'a', 'por', 'con', 'para', 'sin', 'so', 'sobre'}
    ROMAN_NUMERALS = {'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'}
    
    words = value.strip().lower().split()
    if not words: return ""
    
    processed_words = []
    
    # Primera palabra siempre capitalizada (o mayúscula si es romano)
    first_word = words[0]
    if first_word in ROMAN_NUMERALS:
        processed_words.append(first_word.upper())
    else:
        processed_words.append(first_word.capitalize())

    for word in words[1:]:
        if word in ROMAN_NUMERALS:
            processed_words.append(word.upper())
        elif word in EXCLUSIONS:
            processed_words.append(word)
        else:
            processed_words.append(word.capitalize())
            
    return " ".join(processed_words)

def sentence_case_cleaner(value):
    return value.strip().capitalize()

def validate_only_letters(value, field_name):
    if not value:
        return value
    if not re.fullmatch(r"^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+$", value):
        raise serializers.ValidationError("Este campo solo puede contener letras.")
    return value

def validate_text_with_spaces(value, field_name):
    """
    Valida que el valor solo contenga letras, espacios y tildes (sin números ni signos especiales).
    Usado para nombres de países, estados, tipos de catálogos, etc.
    """
    if not value:
        return value
    if not re.fullmatch(r"^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$", value):
        raise serializers.ValidationError("Este campo solo puede contener letras.")
    return value

def validate_letters_only_no_spaces(value, field_name):
    """
    Valida que el valor solo contenga letras sin espacios ni tildes (para códigos ISO).
    """
    if not value:
        return value
    if not re.fullmatch(r"^[a-zA-Z]+$", value):
        raise serializers.ValidationError("Este campo solo puede contener letras.")
    return value

def validate_numeric_only(value, field_name):
    """
    Valida que el valor solo contenga números.
    Usado para códigos de banco, etc.
    """
    if not value:
        return value
    if not re.fullmatch(r"^[0-9]+$", value):
        raise serializers.ValidationError("Este campo solo puede contener números.")
    return value

def validate_alphanumeric_with_spaces(value, field_name):
    """
    Valida que el valor solo contenga letras, números, espacios y tildes.
    Usado para nombres de catálogos organizacionales (bancos, departamentos, carriers, etc.)
    """
    if not value:
        return value
    if not re.fullmatch(r"^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]+$", value):
        raise serializers.ValidationError("Este campo solo puede contener letras y números.")
    return value

def validate_min_length(value, min_len):
    """
    Valida que el valor tenga al menos min_len caracteres.
    """
    if not value:
        return value
    if len(value.strip()) < min_len:
        raise serializers.ValidationError(f"Este campo debe tener al menos {min_len} caracteres.")
    return value

def validate_exact_length(value, exact_len):
    """
    Valida que el valor tenga exactamente exact_len caracteres.
    """
    if not value:
        return value
    if len(value.strip()) != exact_len:
        raise serializers.ValidationError(f"Este campo debe tener exactamente {exact_len} caracteres.")
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
                'is_primary': f"Ya existe un registro principal."
            })
    return validated_data

def validate_unique_together(serializer_instance, validated_data, model, field_names, error_template=None):
    """
    Función genérica para validar unique_together con mensajes amigables.
    Los errores se retornan como non_field_errors para mostrarse en el Alert superior.
    
    Args:
        serializer_instance: La instancia del serializer (self)
        validated_data: Los datos validados
        model: El modelo a validar
        field_names: Tupla de nombres de campos que forman el unique_together (ej: ('country', 'name'))
        error_template: Template del mensaje de error. Si no se proporciona, se genera automáticamente.
                       Puede usar {field_name} como placeholders.
    
    Ejemplo de uso:
        validate_unique_together(self, data, State, ('country', 'name'), 
                                error_template='Ya existe un estado con este nombre en {country}.')
    """
    # Obtener valores de los campos
    field_values = {}
    for field_name in field_names:
        value = validated_data.get(field_name)
        if value is not None:
            field_values[field_name] = value
    
    # Si no tenemos todos los valores, no validar
    if len(field_values) != len(field_names):
        return validated_data
    
    # Construir el queryset
    filter_kwargs = {}
    for field_name, value in field_values.items():
        # Para campos de texto, usar case-insensitive
        if isinstance(value, str):
            filter_kwargs[f'{field_name}__iexact'] = value
        else:
            filter_kwargs[field_name] = value
    
    queryset = model.objects.filter(**filter_kwargs)
    if serializer_instance.instance:
        queryset = queryset.exclude(pk=serializer_instance.instance.pk)
    
    if queryset.exists():
        # Generar el mensaje de error
        if error_template:
            # Reemplazar placeholders con valores reales
            error_msg = error_template
            for field_name, value in field_values.items():
                # Si el valor tiene un atributo name (es un objeto), usarlo
                if hasattr(value, 'name'):
                    error_msg = error_msg.replace(f'{{{field_name}}}', value.name)
                else:
                    error_msg = error_msg.replace(f'{{{field_name}}}', str(value))
        else:
            # Mensaje genérico automático
            error_msg = "Ya existe un registro con esta combinación de valores."
        
        # Retornar como non_field_errors para que aparezca en el Alert superior
        raise serializers.ValidationError({
            'non_field_errors': [error_msg]
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

class AddressSerializer(serializers.ModelSerializer):
    # Campos para lectura
    address_type_name = serializers.CharField(source='address_type.name', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)

    class Meta: model = Address; fields = '__all__'
    
    def validate(self, data):
        if data.get('state') and data.get('country') and data['state'].country != data['country']:
            raise serializers.ValidationError({"state": "El estado no pertenece al país."})
        return data
    
class EmergencyContactSerializer(serializers.ModelSerializer):
    relationship_name = serializers.SerializerMethodField()
    phone_country_code = serializers.SerializerMethodField()
    phone_carrier_code = serializers.SerializerMethodField()
    
    class Meta: 
        model = EmergencyContact
        fields = '__all__'
    
    def get_relationship_name(self, obj):
        return obj.relationship.name if obj.relationship else None
    
    def get_phone_country_code(self, obj):
        # Venezuela solamente, prefijo fijo +58
        return "+58" if obj.phone_carrier_code else None
    
    def get_phone_carrier_code(self, obj):
        return obj.phone_carrier_code.code if obj.phone_carrier_code else None
    
    def validate_phone_number(self, value):
        if not value.isdigit(): raise serializers.ValidationError("Este campo solo puede contener números.")
        return value
    def validate(self, data): return validate_single_primary(self, data, EmergencyContact, "Contacto")
    def validate_first_name(self, value): return title_case_cleaner(validate_only_letters(value, "Nombre"))
    def validate_second_name(self, value): return title_case_cleaner(validate_only_letters(value, "Segundo Nombre")) if value else value
    def validate_paternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Paterno"))
    def validate_maternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Materno")) if value else value

# --- Serializers de Catálogo ---
class SalutationSerializer(serializers.ModelSerializer):
    class Meta: model = Salutation; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(Salutation, 'name', cleaned, self.instance)
class GenderSerializer(serializers.ModelSerializer):
    class Meta: model = Gender; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(Gender, 'name', cleaned, self.instance)
class MaritalStatusSerializer(serializers.ModelSerializer):
    class Meta: model = MaritalStatus; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(MaritalStatus, 'name', cleaned, self.instance)
class CountrySerializer(serializers.ModelSerializer):
    class Meta: model = Country; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(Country, 'name', cleaned, self.instance)
    def validate_iso_2(self, value): 
        validated = validate_letters_only_no_spaces(value, 'Código ISO')
        validate_exact_length(validated, 2)
        return check_uniqueness(Country, 'iso_2', validated.strip().upper(), self.instance)

class DisabilityGroupSerializer(serializers.ModelSerializer):
    class Meta: model = DisabilityGroup; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(DisabilityGroup, 'name', cleaned, self.instance)
class DisabilityTypeSerializer(serializers.ModelSerializer):
    class Meta: model = DisabilityType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(DisabilityType, 'name', cleaned, self.instance)
class DisabilityStatusSerializer(serializers.ModelSerializer):
    class Meta: model = DisabilityStatus; fields = '__all__'
    def validate_name(self, value): 
        cleaned = sentence_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(DisabilityStatus, 'name', cleaned, self.instance)
class AddressTypeSerializer(serializers.ModelSerializer):
    class Meta: model = AddressType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(AddressType, 'name', cleaned, self.instance)
class EmailTypeSerializer(serializers.ModelSerializer):
    class Meta: model = EmailType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(EmailType, 'name', cleaned, self.instance)
class PhoneTypeSerializer(serializers.ModelSerializer):
    class Meta: model = PhoneType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(PhoneType, 'name', cleaned, self.instance)
class PhoneCarrierSerializer(serializers.ModelSerializer):
    class Meta: model = PhoneCarrier; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_alphanumeric_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(PhoneCarrier, 'name', cleaned, self.instance)
class BankSerializer(serializers.ModelSerializer):
    class Meta: model = Bank; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_alphanumeric_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(Bank, 'name', cleaned, self.instance)
    def validate_code(self, value): 
        validated = validate_numeric_only(value, 'Código')
        validate_exact_length(validated, 4)
        return check_uniqueness(Bank, 'code', validated.strip(), self.instance)
class BankAccountTypeSerializer(serializers.ModelSerializer):
    class Meta: model = BankAccountType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(BankAccountType, 'name', cleaned, self.instance)
class RelationshipTypeSerializer(serializers.ModelSerializer):
    class Meta: model = RelationshipType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return check_uniqueness(RelationshipType, 'name', cleaned, self.instance)
class StateSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    # Include nested country object for display
    country = serializers.SerializerMethodField()
    
    class Meta:
        model = State
        fields = '__all__'
        # Deshabilitar validación automática de unique_together para manejarla manualmente
        validators = []
    
    def get_country(self, obj):
        if obj.country:
            return {'id': obj.country.id, 'name': obj.country.name}
        return None
    
    def validate_name(self, value):
        cleaned = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned, 2)
        return cleaned
    
    def validate(self, data):
        # Usar helper genérico para unique_together
        return validate_unique_together(
            self, data, State, ('country', 'name'),
            error_template='Ya existe un estado con este nombre en {country}.'
        )
class PhoneCarrierCodeSerializer(serializers.ModelSerializer):
    carrier_name = serializers.CharField(source='carrier.name', read_only=True)
    # Include nested carrier object for display
    carrier = serializers.SerializerMethodField()
    
    class Meta:
        model = PhoneCarrierCode
        fields = '__all__'
        # Deshabilitar validación automática de unique_together
        validators = []
    
    def get_carrier(self, obj):
        if obj.carrier:
            return {'id': obj.carrier.id, 'name': obj.carrier.name}
        return None
    
    def validate_code(self, value):
        value = value.strip()
        
        # Normalización: Si tiene 3 dígitos, agregar '0' al inicio
        if len(value) == 3 and value.isdigit():
            value = '0' + value
        
        # Validar que solo contenga números
        if not value.isdigit():
            raise serializers.ValidationError("Este campo solo puede contener números.")
        
        # Validar longitud exacta de 4 caracteres
        if len(value) != 4:
            raise serializers.ValidationError("Este campo debe tener exactamente 4 dígitos.")
        
        # Validar que comience con '0'
        if not value.startswith('0'):
            raise serializers.ValidationError("El código debe comenzar con '0'.")
        
        return value
    
    def validate(self, data):
        # Validación manual de unique_together con mensaje personalizado
        return validate_unique_together(
            self, data, PhoneCarrierCode, ('carrier', 'code'),
            error_template='Ya existe este código para la operadora {carrier}.'
        )

# --- SERIALIZERS PRINCIPALES ---

class NationalIdSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    document_type_name = serializers.CharField(source='get_category_display', read_only=True) # Alias para frontend
    prefix = serializers.CharField(source='document_type', read_only=True) # V, E, J...
    full_document = serializers.SerializerMethodField()

    class Meta: 
        model = NationalId
        fields = '__all__'
        validators = [
            UniqueTogetherValidator(queryset=NationalId.objects.all(), fields=['document_type', 'number'], message="Este documento ya está registrado en el sistema."),
            UniqueTogetherValidator(queryset=NationalId.objects.all(), fields=['person', 'category'], message="Esta persona ya tiene un documento de esta categoría registrado.")
        ]
    
    def get_full_document(self, obj): return f"{obj.document_type}-{obj.number}"
    
    def validate_number(self, value):
        if not value.strip().isdigit(): raise serializers.ValidationError("Este campo solo puede contener números.")
        return value.strip()
        
    def validate(self, data): return validate_single_primary(self, data, NationalId, "ID Nacional")


class PersonEmailSerializer(serializers.ModelSerializer):
    email_type_name = serializers.CharField(source='email_type.name', read_only=True)

    class Meta: 
        model = PersonEmail
        fields = '__all__'
        extra_kwargs = {
            'email_address': {
                'error_messages': {
                    'unique': 'Este email ya se encuentra registrado.'
                }
            }
        }
    
    def validate_email_address(self, value):
        return value.strip().lower() 
    
    def validate(self, data):
        is_primary = data.get('is_primary', getattr(self.instance, 'is_primary', False))
        person = data.get('person')
        if is_primary:
            queryset = PersonEmail.objects.filter(person=person, is_primary=True)
            if self.instance: queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({'is_primary': "Ya existe un correo principal."}) 
        return data


class PersonPhoneSerializer(serializers.ModelSerializer):
    phone_type_name = serializers.CharField(source='phone_type.name', read_only=True)
    carrier_code_val = serializers.CharField(source='carrier_code.code', read_only=True) # Ej: 0414
    full_number = serializers.SerializerMethodField()

    class Meta: 
        model = PersonPhone; 
        fields = '__all__'
        validators = [
            UniqueTogetherValidator(
                queryset=PersonPhone.objects.all(),
                fields=['carrier_code', 'subscriber_number'],
                message="Este número de teléfono ya se encuentra registrado."
            )
        ]
    
    def get_full_number(self, obj):
        # Venezuela solamente, prefijo fijo +58
        if obj.carrier_code:
            return f"+58 {obj.carrier_code.code} {obj.subscriber_number}"
        return obj.subscriber_number

    def validate_subscriber_number(self, value):
        value = value.strip()
        if not value.isdigit():
            raise serializers.ValidationError("Este campo solo puede contener números.")
        if len(value) != 7:
            raise serializers.ValidationError("Este campo debe tener exactamente 7 dígitos.")
        return value

    def validate(self, data):
        is_primary = data.get('is_primary', getattr(self.instance, 'is_primary', False))
        person = data.get('person')
        if is_primary:
            queryset = PersonPhone.objects.filter(person=person, is_primary=True)
            if self.instance: queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({'is_primary': "Ya existe un teléfono principal."})
        return data
    
class PersonBankAccountSerializer(serializers.ModelSerializer):
    bank_name = serializers.CharField(source='bank.name', read_only=True)
    bank_code = serializers.CharField(source='bank.code', read_only=True)
    bank_account_type_name = serializers.CharField(source='bank_account_type.name', read_only=True)

    class Meta: model = PersonBankAccount; fields = '__all__'
    def validate_account_number(self, value):
        if not value.isdigit() or len(value) != 20: raise serializers.ValidationError("Este campo debe tener 20 dígitos.")
        return value
    def validate(self, data): return validate_single_primary(self, data, PersonBankAccount, "Cuenta Bancaria")



class DependentSerializer(serializers.ModelSerializer):
    relationship_name = serializers.SerializerMethodField()
    gender_name = serializers.CharField(source='gender.name', read_only=True)
    
    class Meta: 
        model = Dependent
        fields = '__all__'
    
    validators = [UniqueTogetherValidator(queryset=Dependent.objects.all(), fields=['person', 'first_name', 'paternal_surname'])]
    
    def get_relationship_name(self, obj):
        return obj.relationship.name if obj.relationship else None
    
    def validate_birthdate(self, value):
        if value > date.today(): raise serializers.ValidationError("No se permiten fechas futuras.")
        return value
    def validate_first_name(self, value): return title_case_cleaner(validate_only_letters(value, "Nombre"))
    def validate_second_name(self, value): return title_case_cleaner(validate_only_letters(value, "Segundo Nombre")) if value else value
    def validate_paternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Paterno"))
    def validate_maternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Materno")) if value else value


class PersonListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    primary_document = serializers.SerializerMethodField()
    primary_email = serializers.SerializerMethodField()
    primary_phone = serializers.SerializerMethodField()
    hiring_search = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = ['id', 'photo', 'full_name', 'primary_document', 'primary_email', 'primary_phone', 'hiring_search']
    
    def get_full_name(self, obj): return f"{obj.first_name} {obj.paternal_surname}".strip()
    
    def get_primary_document(self, obj):
        doc = obj.national_ids.filter(is_primary=True).first()
        return f"{doc.get_category_display()} {doc.document_type}-{doc.number}" if doc else "—"
    
    def get_primary_email(self, obj):
        e = obj.emails.filter(is_primary=True).first()
        return e.email_address if e else "—"
    
    def get_primary_phone(self, obj):
        p = obj.phones.filter(is_primary=True).first()
        if not p:
            return "—"
        if p.carrier_code:
            return f"({p.carrier_code.code}) {p.subscriber_number}"
        return p.subscriber_number
        
    def get_hiring_search(self, obj):
        doc = obj.national_ids.filter(is_primary=True).first()
        doc_str = f"{doc.document_type}-{doc.number}" if doc else "Sin Cédula"
        return f"{obj.first_name} {obj.paternal_surname} ({doc_str})"

class PersonSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    primary_document = serializers.SerializerMethodField()
    primary_email = serializers.SerializerMethodField()
    primary_phone = serializers.SerializerMethodField()
    photo = serializers.FileField(required=False, allow_null=True)
    gender_name = serializers.CharField(source='gender.name', read_only=True)
    country_of_birth_name = serializers.CharField(source='country_of_birth.name', read_only=True)
    
    addresses = AddressSerializer(many=True, read_only=True)
    phones = PersonPhoneSerializer(many=True, read_only=True)
    emails = PersonEmailSerializer(many=True, read_only=True)
    national_ids = NationalIdSerializer(many=True, read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    bank_accounts = PersonBankAccountSerializer(many=True, read_only=True)
    dependents = DependentSerializer(many=True, read_only=True)

    class Meta: model = Person; fields = '__all__'
    
    def to_internal_value(self, data):
        if hasattr(data, 'copy'): data = data.copy()
        if 'photo' in data and data['photo'] == 'DELETE': data['photo'] = None
        return super().to_internal_value(data)

    def validate_birthdate(self, value):
        if value and value > date.today(): raise serializers.ValidationError("No se permiten fechas futuras.")
        return value
    def validate_first_name(self, value): return title_case_cleaner(validate_only_letters(value, "Primer Nombre"))
    def validate_second_name(self, value): return title_case_cleaner(validate_only_letters(value, "Segundo Nombre")) if value else value
    def validate_paternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Paterno"))
    def validate_maternal_surname(self, value): return title_case_cleaner(validate_only_letters(value, "Apellido Materno")) if value else value

    def get_full_name(self, obj):
        """Devuelve el nombre completo usando el __str__ del modelo"""
        return str(obj)

    def get_primary_document(self, obj):
        """Busca el documento marcado como principal"""
        # Usamos el related_name='national_ids' definido en el modelo
        doc = obj.national_ids.filter(is_primary=True).first()
        return str(doc) if doc else None

    def get_primary_email(self, obj):
        """Busca el correo marcado como principal"""
        # Usamos el related_name='emails'
        email = obj.emails.filter(is_primary=True).first()
        return email.email_address if email else None

    def get_primary_phone(self, obj):
        """Busca el teléfono marcado como principal"""
        # Usamos el related_name='phones'
        phone = obj.phones.filter(is_primary=True).first()
        if not phone:
            return None
        # El __str__ del modelo PersonPhone también accede a carrier_code.code, así que manejamos el caso
        if phone.carrier_code:
            return str(phone)
        return phone.subscriber_number

class PersonDisabilityVESerializer(serializers.ModelSerializer):
    class Meta: model = PersonDisabilityVE; fields = '__all__'
    def validate(self, data):
        if data.get('date_learned') and data.get('date_of_determination') and data['date_learned'] > data['date_of_determination']:
            raise serializers.ValidationError({"date_learned": "Las fechas son inconsistentes."})
        return data




class PersonDocumentSerializer(serializers.ModelSerializer):
    class Meta: model = PersonDocument; fields = '__all__'

class PersonNationalitySerializer(serializers.ModelSerializer):
    class Meta: model = PersonNationality; fields = '__all__'



