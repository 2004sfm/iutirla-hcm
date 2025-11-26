from rest_framework import serializers
from core.serializers import check_uniqueness, title_case_cleaner, validate_alphanumeric_with_spaces
from .models import Department, JobTitle, Position, PositionObjective, PositionRequirement

class DepartmentSerializer(serializers.ModelSerializer):
    # Campo extra para mostrar el nombre del padre
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Department
        fields = '__all__'

    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_alphanumeric_with_spaces(value, 'Nombre'))
        return check_uniqueness(Department, 'name', cleaned, self.instance, "Ya existe un departamento con este nombre.")

    def validate(self, data):
        parent = data.get('parent')
        if self.instance and parent and parent.id == self.instance.id:
            raise serializers.ValidationError({
                "parent": "Un departamento no puede ser su propio departamento padre (referencia circular)."
            })
        return data

class JobTitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobTitle
        fields = '__all__'
    
    def validate_name(self, value): 
        cleaned = title_case_cleaner(validate_alphanumeric_with_spaces(value, 'Nombre'))
        return check_uniqueness(JobTitle, 'name', cleaned, self.instance, "Ya existe un cargo con este nombre.")

class PositionSerializer(serializers.ModelSerializer):
    # --- CAMPOS DE LECTURA PARA LA TABLA ---
    # Usamos source='relation.name' porque department y job_title tienen campo 'name'
    department_name = serializers.CharField(source='department.name', read_only=True)
    job_title_name = serializers.CharField(source='job_title.name', read_only=True)
    
    # FIX: Usamos SerializerMethodField para el Jefe Inmediato.
    # Esto evita el error "<method-wrapper>" cuando el jefe es None.
    manager_position_name = serializers.SerializerMethodField()
    
    # Campo para el select (Combo box)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Position
        fields = '__all__'

    def get_full_name(self, obj):
        return str(obj)

    def get_manager_position_name(self, obj):
        """Devuelve el nombre del jefe o '—' si no tiene."""
        if obj.manager_position:
            return str(obj.manager_position)
        return None # O puedes retornar "—" si prefieres que se vea un guion

    def validate(self, data):
        manager_position = data.get('manager_position')
        if self.instance and manager_position and manager_position.id == self.instance.id:
            raise serializers.ValidationError({
                "manager_position": "Una posición no puede reportarse a sí misma."
            })
        return data

# Serializers simples para detalles
class PositionObjectiveSerializer(serializers.ModelSerializer):
    class Meta: model = PositionObjective; fields = '__all__'

class PositionRequirementSerializer(serializers.ModelSerializer):
    class Meta: model = PositionRequirement; fields = '__all__'