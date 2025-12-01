from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password as django_validate_password
from core.models import (
    Person, Gender, MaritalStatus, Country
)
# FIX: Importamos check_uniqueness para blindar el username contra Errores 500
from core.serializers import PersonSerializer, check_uniqueness
from .models import User
from dj_rest_auth.serializers import LoginSerializer
from django.utils.translation import gettext_lazy as _

class UserReadSerializer(serializers.ModelSerializer):
    person = PersonSerializer(read_only=True)
    class Meta:
        model = User
        fields = (
                'id',
                'username', 
                'is_staff', 
                'is_active', 
                'person'
            )

class EmployeeCreationSerializer(serializers.ModelSerializer):
    # Campos de Contraseña
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Vincular Persona Existente
    person_id = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.all(), 
        source='person', 
        write_only=True, 
        required=False
    )
    
    # Crear Nueva Persona (Campos planos que mapearemos manualmente)
    first_name = serializers.CharField(max_length=100, write_only=True, required=False)
    second_name = serializers.CharField(max_length=100, write_only=True, required=False)
    paternal_surname = serializers.CharField(max_length=100, write_only=True, required=False)
    maternal_surname = serializers.CharField(max_length=100, write_only=True, required=False)
    birthdate = serializers.DateField(write_only=True, required=False)
    
    # FKs para nueva persona
    gender_id = serializers.PrimaryKeyRelatedField(
        queryset=Gender.objects.all(), write_only=True, required=False, source='gender'
    )
    marital_status_id = serializers.PrimaryKeyRelatedField(
        queryset=MaritalStatus.objects.all(), write_only=True, required=False, source='marital_status'
    )
    country_of_birth_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(), write_only=True, required=False, source='country_of_birth'
    )
    photo = serializers.ImageField(write_only=True, required=False)

    # Salida
    person = PersonSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 
            'username', 
            'password', 
            'confirm_password', 
            'person',
            
            # Inputs
            'person_id',
            'first_name', 'second_name', 'paternal_surname', 'maternal_surname',
            'birthdate', 'salutation_id', 'gender_id', 
            'marital_status_id', 'country_of_birth_id', 'photo'
        )

    def validate_username(self, value):
        """Normaliza el usuario a minúsculas y verifica unicidad."""
        cleaned = value.strip().lower()
        
        # FIX: Usamos check_uniqueness para asegurar que el valor normalizado no exista ya.
        return check_uniqueness(User, 'username', cleaned, self.instance, "Este nombre de usuario ya está registrado.")

    def validate(self, data):
        # 1. Validación de Contraseñas Coincidentes
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Las contraseñas no coinciden."})

        # 2. Validación de Complejidad de Contraseña (Django Standard)
        if 'password' in data:
            try:
                django_validate_password(data['password'])
            except Exception as e:
                raise serializers.ValidationError({"password": list(e.messages)})

        # 3. Lógica de Persona (Existente vs Nueva)
        PERSON_WRITE_FIELDS = [
            'first_name', 'second_name', 'paternal_surname', 'maternal_surname',
            'birthdate', 'salutation', 'gender', 'marital_status',
            'country_of_birth', 'photo'
        ]
        
        # Detectar qué campos de "Nueva Persona" vienen en la data
        new_person_data = {k: v for k, v in data.items() if k in PERSON_WRITE_FIELDS}
        has_new_person_data = bool(new_person_data)
        has_person_id = 'person' in data # 'person' es el source de 'person_id'

        # Regla: O vinculas o creas, no ambas.
        if has_person_id and has_new_person_data:
            raise serializers.ValidationError(
                "No puede proveer 'person_id' y datos de nueva persona a la vez."
            )

        # Regla: Debes hacer al menos una cosa.
        if not has_person_id and not has_new_person_data:
             raise serializers.ValidationError(
                 "Debe proveer 'person_id' (para vincular existente) o datos para crear una nueva persona."
             )

        # Regla: Si creas nueva, mínimos requeridos.
        if has_new_person_data:
            if not ('first_name' in data and 'paternal_surname' in data):
                raise serializers.ValidationError("Para crear una nueva persona, 'first_name' y 'paternal_surname' son obligatorios.")

            # --- BLINDAJE CORE ---
            # Validamos usando PersonSerializer para aplicar las reglas de core
            person_validator = PersonSerializer(data=new_person_data)
            if not person_validator.is_valid():
                raise serializers.ValidationError(person_validator.errors)

        # Regla: Si vinculas, que no tenga usuario ya.
        if has_person_id:
            person = data['person']
            if hasattr(person, 'user_account'): 
                 raise serializers.ValidationError(
                     f"La persona '{person}' ya tiene un usuario asignado ({person.user_account.username})."
                 )
            
        return data

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        
        PERSON_FIELDS = [
            'first_name', 'second_name', 'paternal_surname', 'maternal_surname',
            'birthdate', 'salutation', 'gender', 'marital_status',
            'country_of_birth', 'photo'
        ]
        
        new_person = None
        
        if 'person' in validated_data:
            new_person = validated_data.pop('person')
            for field in PERSON_FIELDS:
                validated_data.pop(field, None)
        else:
            person_data = {}
            for field in PERSON_FIELDS:
                if field in validated_data:
                    person_data[field] = validated_data.pop(field)
            
            # Creamos la persona (Ya validada en validate())
            new_person = Person.objects.create(**person_data)
        
        # Crear Usuario
        password = validated_data.pop('password')
        new_user = User.objects.create_user(
            password=password,
            person=new_person,
            **validated_data
        )
        
        return new_user

class CustomUserDetailsSerializer(serializers.ModelSerializer):
    """
    Serializer para ver detalles del usuario logueado.
    """
    person = PersonSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('pk', 'username', 'is_staff', 'person')

class CustomLoginSerializer(LoginSerializer):
    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except serializers.ValidationError:
            # Capturamos cualquier error de validación (incluyendo credenciales inválidas)
            # y lanzamos nuestro mensaje personalizado.
            msg = _('Usuario o contraseña incorrectos. Por favor verifique sus datos e intente nuevamente.')
            raise serializers.ValidationError(msg)