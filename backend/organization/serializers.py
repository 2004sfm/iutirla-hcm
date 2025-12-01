from rest_framework import serializers
from core.serializers import check_uniqueness, title_case_cleaner, validate_alphanumeric_with_spaces
from .models import Department, JobTitle, Position, PositionRequirement, PositionFunction

# Serializers simples para detalles
class PositionRequirementSerializer(serializers.ModelSerializer):
    class Meta: model = PositionRequirement; fields = '__all__'

class PositionFunctionSerializer(serializers.ModelSerializer):
    class Meta: 
        model = PositionFunction
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    # Campo extra para mostrar el nombre del padre
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    # Include nested parent object for display
    parent = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'
    
    def get_parent(self, obj):
        if obj.parent:
            return {'id': obj.parent.id, 'name': obj.parent.name}
        return None

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
    
    # Campos para múltiples jefes (M2M)
    manager_positions_names = serializers.SerializerMethodField()
    reports_to_names_display = serializers.SerializerMethodField()
    manager_positions_data = serializers.SerializerMethodField()
    
    # Campo para el select (Combo box)
    full_name = serializers.SerializerMethodField()

    # Detalles anidados
    requirements = PositionRequirementSerializer(many=True, read_only=True)
    functions = PositionFunctionSerializer(many=True, read_only=True)
    
    # Campo calculado para empleados activos
    active_employees_count = serializers.SerializerMethodField()

    class Meta:
        model = Position
        fields = '__all__'
        # Deshabilitar validación automática de unique_together
        validators = []

    def get_full_name(self, obj):
        return str(obj)
    
    def get_active_employees_count(self, obj):
        """Devuelve el número de empleados activos en esta posición."""
        from employment.models import Employment, is_active_status
        # Actualizado para usar is_active_status
        all_emps = Employment.objects.filter(position=obj)
        return sum(1 for e in all_emps if is_active_status(e.current_status))

    def get_manager_positions_names(self, obj):
        """Devuelve una lista con los nombres de los cargos de los jefes."""
        return [
            str(manager)
            for manager in obj.manager_positions.all() 
        ]

    def get_reports_to_names_display(self, obj):
        """Devuelve un string separado por comas con los nombres de los cargos de los jefes."""
        names = self.get_manager_positions_names(obj)
        return ", ".join(names) if names else "-"

    def get_manager_positions_data(self, obj):
        """Devuelve información completa de los jefes para detección de cross-department."""
        return [
            {
                'id': manager.id,
                'job_title_name': manager.job_title.name if manager.job_title else None,
                'department_id': manager.department.id if manager.department else None,
            }
            for manager in obj.manager_positions.all()
        ]


    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        
        # Manejar manager_positions: si viene como valor único, convertir a lista
        if 'manager_positions' in data:
            value = data['manager_positions']
            if not isinstance(value, list):
                # If value is an empty string, treat it as an empty list
                if value == "":
                    data['manager_positions'] = []
                elif value:
                    data['manager_positions'] = [value]
                else:
                    data['manager_positions'] = []
        
        return super().to_internal_value(data)

    def validate(self, data):
        # Importar aquí para evitar import circular
        from core.serializers import validate_unique_together
        
        # Usar helper genérico para unique_together
        return validate_unique_together(
            self, data, Position, ('department', 'job_title'),
            error_template='Ya existe una posición con este cargo en {department}.'
        )
