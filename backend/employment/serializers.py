from rest_framework import serializers
from django.db.models import Q
from django.utils import timezone
from django.db import transaction
from core.serializers import check_uniqueness, title_case_cleaner, validate_text_with_spaces, validate_min_length
# Importamos utilidades y modelos necesarios de las apps correctas:
from organization.models import Position 
from .models import (
    Employment, EmploymentStatusLog, EmploymentDepartmentRole, PersonDepartmentRole,
    is_active_status, EmploymentStatusChoices, HierarchicalRoleChoices
)

# --- Serializer de Status Log ---

class EmploymentStatusLogSerializer(serializers.ModelSerializer):
    # Muestra el nombre del estatus en lugar del código
    status_name = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = EmploymentStatusLog
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
    
    # Para mostrar el nombre del estatus en lectura
    current_status_display = serializers.CharField(source='get_current_status_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    
    position_full_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    position_full_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()
    person_photo = serializers.SerializerMethodField()

    class Meta:
        model = Employment
        fields = '__all__' 

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
        if person and position and current_status and is_active_status(current_status):
            
            # Buscamos si hay OTROS contratos vigentes para esta misma persona y cargo
            all_employments = Employment.objects.filter(
                person=person,
                position=position,
            )
            
            # Si estamos editando, nos excluimos a nosotros mismos de la búsqueda
            if self.instance:
                all_employments = all_employments.exclude(pk=self.instance.pk)

            # Filtrar solo los activos usando helper function
            duplicates = [e for e in all_employments if is_active_status(e.current_status)]

            if duplicates:
                # Obtenemos el estatus del conflicto para ser específicos en el mensaje
                conflict_status = duplicates[0].get_current_status_display()
                raise serializers.ValidationError({
                    "current_status": f"Esta persona ya tiene un contrato vigente ({conflict_status}) en este cargo. Debe finalizar el anterior antes de activar este."
                })

        # ---------------------------------------------------------------------
        # 4. CONTROL DE VACANTES (Optimizado con is_active_status)
        # ---------------------------------------------------------------------
        # Solo validamos si cambiamos de posición o es nuevo registro
        if position and (not self.instance or self.instance.position != position):
            
            position_obj = position # Ya es el objeto Position gracias a DRF
            
            # Contamos cuántos empleados están ocupando esa posición (usando la bandera booleana)
            all_position_employments = Employment.objects.filter(position=position_obj)
            
            # Nota: No necesitamos restar 1 manualmente si usamos exclude(pk) correctamente
            if self.instance:
                all_position_employments = all_position_employments.exclude(pk=self.instance.pk)
            
            # Contamos solo los activos
            current_occupancy = sum(1 for e in all_position_employments if is_active_status(e.current_status))
            max_vacancies = position_obj.vacancies
            
            if current_occupancy >= max_vacancies:
                raise serializers.ValidationError({
                    'position': f'La posición "{str(position_obj)}" está completa ({current_occupancy}/{max_vacancies}). No hay vacantes disponibles.'
                })
        
        return data

    def get_person_full_name(self, obj):
        return str(obj.person) if obj.person else "Desconocido"

    def get_person_document(self, obj):
        if obj.person:
            doc = obj.person.national_ids.filter(is_primary=True).first()
            if doc:
                return f"{doc.document_type}-{doc.number}"
        return "Sin Documento"

    def get_user_account_details(self, obj):
        if obj.person and hasattr(obj.person, 'user_account'):
            user = obj.person.user_account
            return {
                'id': user.id,
                'username': user.username,
                'is_active': user.is_active,
                'is_staff': user.is_staff
            }
        return None

    def get_supervisor_info(self, obj):
        if not obj.position:
            return None

        # Support for ManyToMany manager_positions
        boss_positions = obj.position.manager_positions.all()
        
        if not boss_positions.exists():
            return None

        # Iterate through all boss positions to find an active boss
        for boss_position in boss_positions:
            boss_employments = boss_position.employments.all()
            
            for emp in boss_employments:
                if is_active_status(emp.current_status):
                    return {
                        "id": emp.person.id,
                        "name": str(emp.person),
                        "position": boss_position.title
                    }
        
        # If boss positions exist but no one is active
        first_boss_pos = boss_positions.first()
        return {
            "id": None,
            "name": "VACANTE",
            "position": first_boss_pos.title if first_boss_pos else "Sin Jefe"
        }

    def get_position_full_name(self, obj):
        """Resuelve el nombre del cargo (Position)."""
        if obj.position and obj.position.job_title:
            return obj.position.job_title.name
        return str(obj.position) if obj.position else "Sin Cargo Asignado"

    def get_department_name(self, obj):
        """Resuelve el nombre del Departamento a través de la Posición."""
        if obj.position and obj.position.department:
            return obj.position.department.name
        return "N/A"

    def get_department_id(self, obj):
        """Resuelve el ID del Departamento a través de la Posición."""
        if obj.position and obj.position.department:
            return obj.position.department.id
        return None

    def get_person_photo(self, obj):
        """Retorna la URL de la foto de la persona si existe."""
        if obj.person and obj.person.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.person.photo.url)
            return obj.person.photo.url
        return None


# --- SERIALIZADOR DE ROLES JERÁRQUICOS EN DEPARTAMENTO ---

class EmploymentDepartmentRoleSerializer(serializers.ModelSerializer):
    # Campos de lectura para mostrar información detallada
    employment_person_name = serializers.CharField(source='employment.person.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    hierarchical_role_display = serializers.CharField(source='get_hierarchical_role_display', read_only=True)
    is_current = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = EmploymentDepartmentRole
        fields = '__all__'
    
    def validate(self, data):
        """Validaciones personalizadas"""
        employment = data.get('employment')
        department = data.get('department')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        hierarchical_role = data.get('hierarchical_role')
        
        # 1. Validar que el departamento coincide con el del employment
        # 1. Validar que el departamento coincide con el del employment - REMOVED for Matrix Support
        # if employment and department:
        #     if employment.position and employment.position.department != department:
        #         raise serializers.ValidationError({
        #             'department': f'El departamento debe coincidir con el departamento de la posición del empleado ({employment.position.department.name})'
        #         })
        
        # 2. Validar que end_date sea posterior a start_date
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
        
        # 3. Validar que no exista otro rol activo para el mismo employment y department
        if employment and department:
            # Obtener el ID de la instancia actual (en caso de UPDATE)
            instance_pk = self.instance.pk if self.instance else None
            
            # Buscar roles activos (sin end_date o con end_date futuro)
            existing_active_roles = EmploymentDepartmentRole.objects.filter(
                employment=employment,
                department=department,
                end_date__isnull=True
            ).exclude(pk=instance_pk)
            
            if existing_active_roles.exists():
                raise serializers.ValidationError({
                    'employment': 'Ya existe un rol jerárquico activo para este empleado en este departamento'
                })
        
        # 4. VALIDACIÓN DE UNICIDAD ACTIVA PARA GERENTES
        # Solo se aplica si el rol es Gerente (MGR)
        if hierarchical_role == HierarchicalRoleChoices.MANAGER and department:
            instance_pk = self.instance.pk if self.instance else None
            today = timezone.now().date()
            
            # Buscar otros gerentes activos en el mismo departamento
            # Un rol está activo si: end_date es NULL O end_date >= hoy
            existing_active_manager = EmploymentDepartmentRole.objects.filter(
                department=department,
                hierarchical_role=HierarchicalRoleChoices.MANAGER
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=today)
            ).exclude(pk=instance_pk).select_related('employment__person').first()
            
            if existing_active_manager:
                conflict_person_name = existing_active_manager.employment.person.full_name
                department_name = department.name
                raise serializers.ValidationError({
                    'hierarchical_role': f'El Departamento {department_name} ya tiene un Gerente activo ({conflict_person_name}). Finalice el rol anterior antes de asignar uno nuevo.'
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
        boss_employments = boss_position.employments.all()
        
        # Filtrar manualmente usando helper function
        active_boss = None
        for emp in boss_employments:
            if is_active_status(emp.current_status):
                active_boss = emp
                break

        if active_boss:
            return {
                "id": active_boss.person.id,
                "name": str(active_boss.person),
                "position": boss_position.name
            }
        
        # Existe el cargo de jefe (ej. Gerente), pero nadie lo ocupa (Vacante)
        return {
            "id": None,
            "name": "VACANTE",
            "position": boss_position.name
        }

# --- SERIALIZADOR DE LISTADO (Ajustado) ---

class EmployeeListSerializer(serializers.ModelSerializer):
    
    person_full_name = serializers.SerializerMethodField()
    person_document = serializers.SerializerMethodField()
    position_full_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    
    # Mostrar el display name en lugar del código
    current_status_display = serializers.CharField(source='get_current_status_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)

    class Meta:
        model = Employment
        fields = '__all__' 

    # --- MÉTODOS CORREGIDOS ---
    
    def get_person_full_name(self, obj):
        """Resuelve el nombre completo de core.Person."""
        # Se asegura de que si la persona existe, usa su __str__ (nombre y apellido)
        return str(obj.person) if obj.person else "Persona Desconocida"

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

    def get_position_full_name(self, obj):
        """Resuelve el nombre del cargo (Position)."""
        # Usa solo el nombre del JobTitle como se solicitó
        if obj.position and obj.position.job_title:
            return obj.position.job_title.name
        return str(obj.position) if obj.position else "Sin Cargo Asignado"

    def get_department_name(self, obj):
        """Resuelve el nombre del Departamento a través de la Posición."""
        # Maneja la cadena de nulos: si no hay position O no hay department, retorna "N/A".
        if obj.position and obj.position.department:
            return obj.position.department.name
        return "N/A"


# --- SERIALIZADOR DE ROLES JERÁRQUICOS POR PERSONA (MATRIZ) ---

class PersonDepartmentRoleSerializer(serializers.ModelSerializer):
    """
    Serializer para roles jerárquicos por persona en departamentos.
    Soporta organizaciones matriciales.
    """
    # Campos de lectura para mostrar información detallada
    person_name = serializers.CharField(source='person.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    hierarchical_role_display = serializers.CharField(source='get_hierarchical_role_display', read_only=True)
    is_current = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PersonDepartmentRole
        fields = '__all__'
    
    def validate(self, data):
        """
        Validaciones personalizadas:
        A) Unicidad de rol activo por persona+departamento
        B) Unicidad de gerente activo por departamento
        """
        person = data.get('person')
        department = data.get('department')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        hierarchical_role = data.get('hierarchical_role')
        
        instance_pk = self.instance.pk if self.instance else None
        today = timezone.now().date()
        
        # Validación básica: end_date posterior a start_date
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
        
        # VALIDACIÓN A: Unicidad de rol activo por persona+departamento
        # Una persona solo puede tener UN rol activo en un departamento a la vez
        if person and department:
            existing_active_role = PersonDepartmentRole.objects.filter(
                person=person,
                department=department
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=today)
            ).exclude(pk=instance_pk).first()
            
            if existing_active_role:
                # NOTA: Esta validación permite la creación porque el método create()
                # auto-finalizará el rol anterior, pero advertimos al usuario
                pass  # La validación está deshabilitada para permitir auto-finalization
        
        # VALIDACIÓN B: Unicidad de gerente activo por departamento
        # Solo puede haber UN gerente activo por departamento
        if hierarchical_role == HierarchicalRoleChoices.MANAGER and department:
            existing_active_manager = PersonDepartmentRole.objects.filter(
                department=department,
                hierarchical_role=HierarchicalRoleChoices.MANAGER
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=today)
            ).exclude(pk=instance_pk).select_related('person').first()
            
            if existing_active_manager:
                conflict_person_name = existing_active_manager.person.full_name
                department_name = department.name
                raise serializers.ValidationError({
                    'hierarchical_role': f'El Departamento {department_name} ya tiene un Gerente activo ({conflict_person_name}). Finalice el rol anterior antes de asignar uno nuevo.'
                })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Lógica de auto-finalización de roles anteriores.
        
        Antes de crear un nuevo rol, busca cualquier rol activo para la
        misma persona+departamento y lo finaliza automáticamente estableciendo
        su end_date al día anterior del start_date del nuevo rol.
        """
        person = validated_data.get('person')
        department = validated_data.get('department')
        new_start_date = validated_data.get('start_date')
        
        # Buscar rol activo anterior para la misma persona+departamento
        existing_active_role = PersonDepartmentRole.objects.filter(
            person=person,
            department=department,
            end_date__isnull=True  # Solo los roles actualmente sin fin
        ).first()
        
        if existing_active_role:
            # Auto-finalizar el rol anterior estableciendo end_date al día anterior
            from datetime import timedelta
            existing_active_role.end_date = new_start_date - timedelta(days=1)
            existing_active_role.save()
        
        # Crear el nuevo rol
        new_role = PersonDepartmentRole.objects.create(**validated_data)
        return new_role
