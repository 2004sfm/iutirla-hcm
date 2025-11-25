from rest_framework import serializers
from django.db import transaction
from core.serializers import check_uniqueness, title_case_cleaner
# Importamos utilidades y modelos necesarios de las apps correctas:
from organization.models import Position 
from .models import (
    Role, EmploymentType, EmploymentStatus, 
    Employment, EmploymentStatusLog # Renombramos History a Log
)

# --- Serializers de Catálogos (Mantenidos) ---

class RoleSerializer(serializers.ModelSerializer):
    class Meta: model = Role; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(value)
        return check_uniqueness(Role, 'name', cleaned, self.instance, "Ya existe un rol con este nombre.")

class EmploymentTypeSerializer(serializers.ModelSerializer):
    class Meta: model = EmploymentType; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(value)
        return check_uniqueness(EmploymentType, 'name', cleaned, self.instance, "Ya existe un tipo de empleo con este nombre.")

class EmploymentStatusSerializer(serializers.ModelSerializer):
    class Meta: model = EmploymentStatus; fields = '__all__'
    def validate_name(self, value): 
        cleaned = title_case_cleaner(value)
        return check_uniqueness(EmploymentStatus, 'name', cleaned, self.instance, "Ya existe un estatus de empleo con este nombre.")


class EmploymentStatusLogSerializer(serializers.ModelSerializer):
    # Muestra el nombre del estatus en lugar del ID
    status_name = serializers.CharField(source='status.name', read_only=True)
    
    class Meta:
        model = EmploymentStatusLog # Apunta al modelo correcto
        fields = '__all__'

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "La fecha de fin del estatus no puede ser anterior a la fecha de inicio."
            })
        return data

# --- SERIALIZADOR DE ESCRITURA Y LECTURA ÚNICA (Employment) ---

class EmploymentSerializer(serializers.ModelSerializer):
    person_full_name = serializers.SerializerMethodField()
    person_document = serializers.SerializerMethodField()
    user_account_details = serializers.SerializerMethodField()
    status_logs = EmploymentStatusLogSerializer(many=True, read_only=True)
    supervisor_info = serializers.SerializerMethodField()

    class Meta:
        model = Employment
        fields = '__all__' 

    # ... (Tus métodos get_person_full_name, etc. van aquí) ...

    def validate(self, data):
        # 1. RECUPERACIÓN DE DATOS (Para Create y Update)
        hire_date = data.get('hire_date')
        end_date = data.get('end_date')
        
        # Recuperamos los objetos completos (DRF convierte los IDs en Objetos aquí)
        person = data.get('person') or (self.instance.person if self.instance else None)
        position = data.get('position') or (self.instance.position if self.instance else None)
        current_status = data.get('current_status') or (self.instance.current_status if self.instance else None)
        
        if self.instance:
            hire_date = hire_date or self.instance.hire_date

        # 2. VALIDACIONES DE FECHA (Mantenidas)
        if end_date and hire_date and end_date < hire_date:
            raise serializers.ValidationError({"end_date": "La fecha de finalización no puede ser anterior a la fecha de contratación."})
        
        if person and person.birthdate and hire_date:
             if hire_date < person.birthdate:
                raise serializers.ValidationError({"hire_date": "La fecha de contratación no puede ser anterior a la fecha de nacimiento."})

        # ---------------------------------------------------------------------
        # 3. NUEVA VALIDACIÓN: INTEGRIDAD DE CONTRATO (NO DUPLICAR ACTIVOS)
        # ---------------------------------------------------------------------
        # Si tenemos estatus y este estatus "ocupa silla" (es activo/vigente)...
        if person and position and current_status and current_status.is_active_relationship:
            
            # Buscamos si hay OTROS contratos vigentes para esta misma persona y cargo
            duplicates = Employment.objects.filter(
                person=person,
                position=position,
                current_status__is_active_relationship=True # <-- Usamos la bandera del modelo
            )

            # Si estamos editando, nos excluimos a nosotros mismos de la búsqueda
            if self.instance:
                duplicates = duplicates.exclude(pk=self.instance.pk)

            if duplicates.exists():
                # Obtenemos el estatus del conflicto para ser específicos en el mensaje
                conflict_status = duplicates.first().current_status.name
                raise serializers.ValidationError({
                    "current_status": f"Esta persona ya tiene un contrato vigente ({conflict_status}) en este cargo. Debe finalizar el anterior antes de activar este."
                })

        # ---------------------------------------------------------------------
        # 4. CONTROL DE VACANTES (Optimizado con is_active_relationship)
        # ---------------------------------------------------------------------
        # Solo validamos si cambiamos de posición o es nuevo registro
        if position and (not self.instance or self.instance.position != position):
            
            position_obj = position # Ya es el objeto Position gracias a DRF
            
            # Contamos cuántos empleados están ocupando esa posición (usando la bandera booleana)
            occupancy_query = Employment.objects.filter(
                position=position_obj, 
                current_status__is_active_relationship=True # <-- Mejor que filter(name='Activo')
            )
            
            # Nota: No necesitamos restar 1 manualmente si usamos exclude(pk) correctamente
            if self.instance:
                occupancy_query = occupancy_query.exclude(pk=self.instance.pk)
                
            current_occupancy = occupancy_query.count()
            max_vacancies = position_obj.vacancies
            
            if current_occupancy >= max_vacancies:
                raise serializers.ValidationError({
                    'position': f'La posición "{str(position_obj)}" está completa ({current_occupancy}/{max_vacancies}). No hay vacantes disponibles.'
                })
        
        return data
    

    @transaction.atomic
    def create(self, validated_data):
        # 🚨 ¡CAMBIO CLAVE! 🚨
        # No hacemos nada con el status aquí. El modelo Employment se encarga de:
        # 1. Guardar el registro.
        # 2. Llamar a su save() (que a su vez llama a full_clean()).
        # 3. Llamar a _create_status_log() automáticamente.
        
        employment = super().create(validated_data)
        
        # Nota: Si tu frontend envía el 'end_date' a NULL, el estatus por defecto 'Activo' 
        # y el log se crean.
        
        return employment
    
    def get_user_account_details(self, obj):
        """
        Retorna detalles básicos del usuario si existe.
        """
        if obj.person and hasattr(obj.person, 'user_account'):
            user = obj.person.user_account
            return {
                'id': user.id,
                'username': user.username,
                'is_active': user.is_active,
                'is_staff': user.is_staff
            }
        return None
    def get_person_full_name(self, obj):
        return str(obj.person) if obj.person else "Desconocido"

    # NUEVO MÉTODO
    def get_person_document(self, obj):
        """
        Busca el documento principal (Cédula) de la persona asociada.
        """
        if obj.person:
            # Usamos la relación inversa 'national_ids' definida en core.models
            doc = obj.person.national_ids.filter(is_primary=True).first()
            if doc:
                return f"{doc.document_type}-{doc.number}"
        return "Sin Documento"
    
    def get_supervisor_info(self, obj):
        """
        Retorna el nombre y cargo del jefe inmediato.
        Lógica: Mi Cargo -> Cargo Jefe -> Persona Activa en Cargo Jefe
        """
        # 1. Validar que tenga posición y esa posición tenga un jefe definido
        if not obj.position or not obj.position.manager_position:
            return None

        boss_position = obj.position.manager_position

        # 2. Buscar quién ocupa la posición del jefe HOY (Activo y Vigente)
        # Usamos la bandera 'is_active_relationship' que creamos
        boss_employment = boss_position.employments.filter(
            current_status__is_active_relationship=True
        ).first() # Asumimos un solo jefe por silla, tomamos el primero que aparezca

        if boss_employment:
            return {
                "id": boss_employment.person.id,
                "name": str(boss_employment.person),
                "position": boss_position.name
            }
        
        # Existe el cargo de jefe (ej. Gerente), pero nadie lo ocupa (Vacante)
        return {
            "id": None,
            "name": "VACANTE",
            "position": boss_position.name
        }

# --- SERIALIZADOR DE LISTADO (Ajustado) ---

# employment/serializers.py

# ... (resto de imports y Serializers de catálogo) ...

# ... (resto del código y imports) ...

class EmployeeListSerializer(serializers.ModelSerializer):
    
    person_full_name = serializers.SerializerMethodField()
    position_full_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    
    current_status = serializers.CharField(source='current_status.name', read_only=True) 

    class Meta:
        model = Employment
        fields = '__all__' 

    # --- MÉTODOS CORREGIDOS ---
    
    def get_person_full_name(self, obj):
        """Resuelve el nombre completo de core.Person."""
        # Se asegura de que si la persona existe, usa su __str__ (nombre y apellido)
        return str(obj.person) if obj.person else "Persona Desconocida"

    def get_position_full_name(self, obj):
        """Resuelve el nombre del cargo (Position)."""
        # Usa el __str__ del objeto Position
        return str(obj.position) if obj.position else "Sin Cargo Asignado"

    def get_department_name(self, obj):
        """Resuelve el nombre del Departamento a través de la Posición."""
        # Maneja la cadena de nulos: si no hay position O no hay department, retorna "N/A".
        if obj.position and obj.position.department:
            return obj.position.department.name
        return "N/A"
        
    # get_current_status ya no es necesario si usamos CharField(source='current_status.name')
    # y si el ViewSet está optimizado con select_related.


