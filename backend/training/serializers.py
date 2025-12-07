from rest_framework import serializers
from django.db import transaction
from django.core.exceptions import ValidationError
from core.models import Person
# --- IMPORTAMOS LAS UTILIDADES NECESARIAS ---
from core.serializers import ( 
    title_case_cleaner, 
    sentence_case_cleaner, 
    check_uniqueness,
    validate_text_with_spaces,
    validate_min_length
)
from .models import (
    Course, CourseResource, CourseSession, CourseParticipant, AttendanceRecord,
    CourseModule, CourseLesson, LessonProgress  # 🆕 NEW: Hierarchical models
)

# --- SERIALIZERS DE AYUDA Y AUDITORÍA ---
class AttendanceRecordSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='participant.person.__str__', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta: 
        model = AttendanceRecord
        fields = '__all__'

class ParticipantListSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.__str__', read_only=True)
    person_id = serializers.IntegerField(source='person.id', read_only=True)
    enrollment_status_name = serializers.CharField(source='get_enrollment_status_display', read_only=True)
    academic_status_name = serializers.CharField(source='get_academic_status_display', read_only=True)

    person_id_document = serializers.SerializerMethodField()

    class Meta:
        model = CourseParticipant
        fields = ['id', 'person_id', 'person_name', 'person_id_document', 'enrollment_status', 'enrollment_status_name', 'academic_status', 'academic_status_name', 'grade', 'created_at', 'course']

    def get_person_id_document(self, obj):
        primary_id = obj.person.national_ids.filter(is_primary=True).first()
        if primary_id:
            return f"{primary_id.document_type}-{primary_id.number}"
        return "S/C"


# --- 1. RECURSOS (Con Limpieza y Validación) ---
class CourseResourceSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source='file', read_only=True)
    
    class Meta: 
        model = CourseResource
        fields = '__all__'
        extra_kwargs = {
            'course': {'required': False}, # Optional if linked to lesson
        }
        
    def validate_name(self, value):
        # Limpieza y validación de nombre (Título)
        cleaned_value = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned_value, 2)
        
        # Validación de unicidad GLOBAL para Recursos (Evita dos PDF con el mismo nombre)
        return check_uniqueness(self.Meta.model, 'name', cleaned_value, self.instance, 
                                error_msg="Ya existe un recurso con este nombre en el sistema.")

    def validate(self, data):
        # Lógica para asegurar que SÓLO se sube un archivo O un link, no ambos.
        file = data.get('file')
        url = data.get('url')
        
        if data.get('resource_type') == 'FIL' and not file and not url:
            raise serializers.ValidationError({"file": "Debe subir un archivo o URL para este tipo."})
            
        if data.get('resource_type') == 'URL' and not url and not file:
            raise serializers.ValidationError({"url": "Debe proporcionar una URL."})
            
        if file and url:
             raise serializers.ValidationError("Un recurso no puede ser archivo y URL al mismo tiempo.")
             
        return data


# --- 2. SESIONES (Con Limpieza y Validación por Curso y Fecha) ---
class CourseSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta: 
        model = CourseSession
        fields = '__all__'

    def validate_topic(self, value):
        # Limpieza de topic (título de sesión)
        return title_case_cleaner(value)

    def validate(self, data):
        topic = data.get('topic')
        course = data.get('course')
        date = data.get('date')
        
        # Validación de unicidad del tema DENTRO del curso y fecha
        # No pueden existir dos sesiones en el mismo curso con el mismo tema el mismo día
        qs = CourseSession.objects.filter(topic__iexact=topic, course=course, date=date)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({"topic": f"Ya existe una sesión sobre '{topic}' programada para esta fecha y curso."})
            
        return data


# --- 🆕 NEW: HIERARCHICAL CONTENT SERIALIZERS ---

class CourseLessonSerializer(serializers.ModelSerializer):
    """Serializer para lecciones individuales."""
    module_name = serializers.CharField(source='module.name', read_only=True)
    resources = CourseResourceSerializer(many=True, read_only=True)
    
    # 🆕 NEW: Course details for permission checks
    course_id = serializers.IntegerField(source='module.course.id', read_only=True)
    course_instructor_id = serializers.IntegerField(source='module.course.instructor.id', read_only=True)

    class Meta:
        model = CourseLesson
        fields = ['id', 'module', 'module_name', 'title', 'content', 'order', 'duration_minutes', 'resources', 'course_id', 'course_instructor_id']
        read_only_fields = ['id', 'module_name', 'course_id', 'course_instructor_id']
    
    def validate_title(self, value):
        """Limpieza de título de lección."""
        return title_case_cleaner(validate_text_with_spaces(value, 'Título'))
    
    def validate(self, data):
        """Validar que no haya lecciones duplicadas en el mismo módulo con el mismo orden."""
        module = data.get('module')
        order = data.get('order')
        
        qs = CourseLesson.objects.filter(module=module, order=order)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        
        if qs.exists():
            raise serializers.ValidationError({
                "order": f"Ya existe una lección con el orden {order} en este módulo."
            })
        
        return data


class CourseModuleSerializer(serializers.ModelSerializer):
    """Serializer para módulos del curso con lecciones anidadas."""
    lessons = CourseLessonSerializer(many=True, read_only=True)
    lesson_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseModule
        fields = ['id', 'course', 'name', 'description', 'order', 'lessons', 'lesson_count']
    
    def get_lesson_count(self, obj):
        return obj.lessons.count()
    
    def validate_name(self, value):
        """Limpieza de nombre de módulo."""
        return title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
    
    def validate(self, data):
        """Validar que no haya módulos duplicados en el mismo curso con el mismo orden."""
        course = data.get('course')
        order = data.get('order')
        
        qs = CourseModule.objects.filter(course=course, order=order)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        
        if qs.exists():
            raise serializers.ValidationError({
                "order": f"Ya existe un módulo con el orden {order} en este curso."
            })
        
        return data


class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer para el progreso de lecciones por estudiante."""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    person_name = serializers.CharField(source='enrollment.person.__str__', read_only=True)
    
    class Meta:
        model = LessonProgress
        fields = ['id', 'enrollment', 'lesson', 'lesson_title', 'person_name', 'completed', 'completed_at']
        read_only_fields = ['completed_at']
    
    def validate(self, data):
        """Validar que no haya duplicados de progreso para la misma lección y enrollment."""
        enrollment = data.get('enrollment')
        lesson = data.get('lesson')
        
        qs = LessonProgress.objects.filter(enrollment=enrollment, lesson=lesson)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        
        if qs.exists():
            raise serializers.ValidationError({
                "lesson": "Ya existe un registro de progreso para esta lección y estudiante."
            })
        
        return data


# --- 3. PARTICIPANTES (Lógica de Cupo y Unicidad de Persona/Curso) ---
# training/serializers.py

class CourseParticipantSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.__str__', read_only=True)
    person_id = serializers.IntegerField(source='person.id', read_only=True)
    enrollment_status_name = serializers.CharField(source='get_enrollment_status_display', read_only=True)
    academic_status_name = serializers.CharField(source='get_academic_status_display', read_only=True)
    
    class Meta:
        model = CourseParticipant
        fields = '__all__'
        
        # 🖊 IMPORTANTE: Esto apaga la validación automática de "Conjunto Único"
        # Nos permite manejar la unicidad manualmente en el método validate()
        validators = [] 

    @transaction.atomic
    def validate(self, data):
        """🔧 REFACTOR: Validación simplificada solo para ESTUDIANTES."""
        
        # Recuperamos la instancia (si existe, es una EDICIÓN)
        instance = self.instance
        
        # Obtenemos los datos finales (ya sea del payload o de la base de datos)
        course = data.get('course', getattr(instance, 'course', None))
        person = data.get('person', getattr(instance, 'person', None))

        # -----------------------------------------------------
        # CASO 1: CREACIÓN (NUEVA INSCRIPCIÓN)
        # -----------------------------------------------------
        if not instance:
            
            # A. Validación Manual de Duplicados
            if CourseParticipant.objects.filter(course=course, person=person).exists():
                raise serializers.ValidationError({
                    "person": f"La persona '{person}' ya está registrada en este curso."
                })

            # B. Reglas de Negocio para Estudiantes NUEVOS
            # El curso debe estar en una fase que permita inscripciones
            if course.status not in [Course.Status.SCHEDULED, Course.Status.IN_PROGRESS]:
                 raise serializers.ValidationError({
                    "course": f"No se pueden inscribir nuevos estudiantes. El curso está '{course.get_status_display()}'."
                 })

            # El curso no debe estar lleno
            if course.is_full:
                raise serializers.ValidationError({
                    "course": f"Cupo lleno ({course.max_participants} máx). No se admiten más inscripciones."
                })

        # -----------------------------------------------------
        # CASO 2: EDICIÓN (EVALUACIÓN / CAMBIOS)
        # -----------------------------------------------------
        if instance:
            # Aquí SOLO validamos cosas que tengan sentido al editar.
            # NO validamos cupo ni estado del curso (porque ya están dentro).
            
            grade = data.get('grade')
            if grade is not None and (grade < 0 or grade > 20):
                 raise serializers.ValidationError({"grade": "La nota debe estar entre 0 y 20."})

        return data


# --- 4. CURSO (PRINCIPAL) ---
class CourseSerializer(serializers.ModelSerializer):
    
    # 🖊 CAMBIO CRÍTICO: De IntegerField a SerializerMethodField
    enrolled_count = serializers.SerializerMethodField() 
    
    is_full = serializers.BooleanField(read_only=True)
    modality_display = serializers.CharField(source='get_modality_display', read_only=True)
    status_name = serializers.CharField(source='get_status_display', read_only=True)
    
    # 🔧 REFACTOR: Instructor como campo editable + campos de solo lectura para display
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.all(),
        required=False,
        allow_null=True
    )
    instructor_id = serializers.IntegerField(source='instructor.id', read_only=True, allow_null=True)
    instructor_name = serializers.CharField(source='instructor.__str__', read_only=True, allow_null=True)
    instructor_id_document = serializers.SerializerMethodField()
    
    # Anidaciones (para la vista de detalle)
    resources = CourseResourceSerializer(many=True, read_only=True)
    sessions = CourseSessionSerializer(many=True, read_only=True)
    modules = CourseModuleSerializer(many=True, read_only=True)  # 🆕 NEW: Hierarchical content
    
    # SerializerMethodField (Solo estudiantes ahora)
    students = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = '__all__'
    
    # --- MÉTODO PARA CALCULAR EL CUPO OFICIAL ---
    def get_enrolled_count(self, obj):
        """
        Calcula el número de estudiantes que ocupan un cupo oficialmente (Inscrito).
        🔧 REFACTOR: Todos los participants son estudiantes ahora.
        """
        return obj.participants.filter(
            enrollment_status=CourseParticipant.EnrollmentStatus.ENROLLED
        ).count()
    
    # 🖊 INTEGRACIÓN DE LIMPIEZA Y UNICIDAD EN EL MODELO PRINCIPAL 🖊
    def validate_name(self, value):
        cleaned_value = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned_value, 2)
        return check_uniqueness(Course, 'name', cleaned_value, self.instance, error_msg="Ya existe un curso con este nombre.")

    def validate_description(self, value):
        return sentence_case_cleaner(value)

    def validate(self, data):
        """
        Validación: Para cursos privados con departamento,
        max_participants debe ser >= número de empleados activos del departamento.
        """
        is_public = data.get('is_public', getattr(self.instance, 'is_public', True))
        department = data.get('department', getattr(self.instance, 'department', None))
        max_participants = data.get('max_participants', getattr(self.instance, 'max_participants', 20))
        
        # Solo validamos si es un curso privado con departamento asignado
        if not is_public and department:
            from employment.models import Employment
            
            # Contar empleados activos únicos del departamento
            active_person_ids = Employment.objects.filter(
                current_status__in=['ACT', 'SUS', 'PER', 'REP'],
                position__department=department
            ).values_list('person_id', flat=True).distinct()
            
            active_employees_count = len(set(active_person_ids))
            
            if max_participants < active_employees_count:
                raise serializers.ValidationError({
                    'max_participants': f'El cupo máximo ({max_participants}) no puede ser menor que el número de empleados activos del departamento ({active_employees_count}).'
                })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Crea el curso y, si es privado con departamento,
        auto-inscribe a todos los empleados activos del departamento.
        """
        course = super().create(validated_data)
        
        # Auto-inscripción para cursos privados con departamento
        if not course.is_public and course.department:
            from employment.models import Employment
            
            # Obtener personas únicas con contratos activos en el departamento
            active_person_ids = Employment.objects.filter(
                current_status__in=['ACT', 'SUS', 'PER', 'REP'],
                position__department=course.department
            ).values_list('person_id', flat=True).distinct()
            
            # Obtener las personas únicas
            unique_person_ids = set(active_person_ids)
            
            # Crear participantes (auto-inscritos)
            participants_to_create = []
            for person_id in unique_person_ids:
                # Verificar que no exista ya (defensa)
                if not CourseParticipant.objects.filter(course=course, person_id=person_id).exists():
                    participants_to_create.append(
                        CourseParticipant(
                            course=course,
                            person_id=person_id,
                            enrollment_status=CourseParticipant.EnrollmentStatus.ENROLLED
                        )
                    )
            
            # Bulk create para eficiencia
            if participants_to_create:
                CourseParticipant.objects.bulk_create(participants_to_create)
        
        return course
    
    def save(self, **kwargs):
        if 'name' in self.validated_data:
            self.validated_data['name'] = title_case_cleaner(self.validated_data['name'])
        if 'description' in self.validated_data:
            self.validated_data['description'] = sentence_case_cleaner(self.validated_data['description'])
        return super().save(**kwargs)

    def get_students(self, obj):
        # 🔧 REFACTOR: Todos los participants son estudiantes ahora
        qs = obj.participants.select_related('person')
        return ParticipantListSerializer(qs, many=True).data

    def get_instructor_id_document(self, obj):
        if not obj.instructor:
            return None
        primary_id = obj.instructor.national_ids.filter(is_primary=True).first()
        if primary_id:
            return f"{primary_id.document_type}-{primary_id.number}"
        return "S/C"