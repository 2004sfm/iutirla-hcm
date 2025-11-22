from rest_framework import serializers
from dateutil.relativedelta import relativedelta # Necesario para cálculo preciso de edad
from datetime import date

# FIX: Importamos check_uniqueness para evitar Errores 500 por duplicados
from core.serializers import title_case_cleaner, check_uniqueness

from .models import (
    Role, EmploymentType, EmploymentStatus, 
    Employment, EmploymentStatusHistory
)

class RoleSerializer(serializers.ModelSerializer):
    class Meta: model = Role; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(value)
        # FIX: Verificación manual de unicidad
        return check_uniqueness(Role, 'name', cleaned, self.instance, "Ya existe un rol con este nombre.")

class EmploymentTypeSerializer(serializers.ModelSerializer):
    class Meta: model = EmploymentType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(value)
        # FIX: Verificación manual de unicidad
        return check_uniqueness(EmploymentType, 'name', cleaned, self.instance, "Ya existe un tipo de empleo con este nombre.")

class EmploymentStatusSerializer(serializers.ModelSerializer):
    class Meta: model = EmploymentStatus; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(value)
        # FIX: Verificación manual de unicidad
        return check_uniqueness(EmploymentStatus, 'name', cleaned, self.instance, "Ya existe un estatus de empleo con este nombre.")

# --- Serializers Principales ---

class EmploymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employment
        fields = '__all__'

    def validate(self, data):
        """
        Validaciones cruzadas de lógica de negocio para el empleo.
        """
        hire_date = data.get('hire_date')
        end_date = data.get('end_date')
        person = data.get('person')

        # Obtener valores de la instancia si es una actualización parcial
        if self.instance:
            hire_date = hire_date or self.instance.hire_date
            person = person or self.instance.person

        # 1. Validación de Fechas (Fin vs Inicio)
        if end_date and hire_date and end_date < hire_date:
            raise serializers.ValidationError({
                "end_date": "La fecha de finalización no puede ser anterior a la fecha de contratación."
            })

        # 2. Validación de Mayoría de Edad (18 años) al momento de la contratación
        if person and person.birthdate and hire_date:
            # Calculamos la edad que tenía la persona EN LA FECHA DE CONTRATACIÓN
            age_at_hire = relativedelta(hire_date, person.birthdate).years
            
            if age_at_hire < 18:
                raise serializers.ValidationError({
                    "hire_date": f"La persona es menor de edad. Tenía {age_at_hire} años en la fecha de contratación indicada. Debe tener al menos 18."
                })
            
            # Opcional: Validación de que no haya nacido después de ser contratado (viajero del tiempo)
            if hire_date < person.birthdate:
                raise serializers.ValidationError({
                    "hire_date": "La fecha de contratación no puede ser anterior a la fecha de nacimiento de la persona."
                })

        return data

class EmploymentStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmploymentStatusHistory
        fields = '__all__'

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # Validar coherencia temporal del historial
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "La fecha de fin del estatus no puede ser anterior a la fecha de inicio."
            })
            
        return data