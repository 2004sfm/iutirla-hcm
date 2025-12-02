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
    Course, CourseResource, CourseSession, CourseParticipant, AttendanceRecord
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
    role_name = serializers.CharField(source='get_role_display', read_only=True)
    enrollment_status_name = serializers.CharField(source='get_enrollment_status_display', read_only=True)
    academic_status_name = serializers.CharField(source='get_academic_status_display', read_only=True)

    class Meta:
        model = CourseParticipant
        fields = ['id', 'person_id', 'person_name', 'role', 'role_name', 'enrollment_status', 'enrollment_status_name', 'academic_status', 'academic_status_name', 'grade']


# --- 1. RECURSOS (Con Limpieza y Validación) ---
class CourseResourceSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source='file', read_only=True)
    
    class Meta: 
        model = CourseResource
        fields = '__all__'
        
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


# --- 3. PARTICIPANTES (Lógica de Cupo y Unicidad de Persona/Curso) ---
# training/serializers.py

class CourseParticipantSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.__str__', read_only=True)
    person_id = serializers.IntegerField(source='person.id', read_only=True)
    role_name = serializers.CharField(source='get_role_display', read_only=True)
    enrollment_status_name = serializers.CharField(source='get_enrollment_status_display', read_only=True)
    academic_status_name = serializers.CharField(source='get_academic_status_display', read_only=True)
    
    class Meta:
        model = CourseParticipant
        fields = '__all__'
        
        # 🚨 IMPORTANTE: Esto apaga la validación automática de "Conjunto Único"
        # Nos permite manejar la unicidad manualmente en el método validate()
        validators = [] 

    @transaction.atomic
    def validate(self, data):
        """Lógica de validación separada para Creación vs. Edición."""
        
        # Recuperamos la instancia (si existe, es una EDICIÓN)
        instance = self.instance
        
        # Obtenemos los datos finales (ya sea del payload o de la base de datos)
        course = data.get('course', getattr(instance, 'course', None))
        person = data.get('person', getattr(instance, 'person', None))
        role = data.get('role', getattr(instance, 'role', None))

        # -----------------------------------------------------
        # CASO 1: CREACIÓN (NUEVA INSCRIPCIÓN)
        # -----------------------------------------------------
        if not instance:
            
            # A. Validación Manual de Duplicados
            # (Reemplaza el mensaje feo de "Conjunto único")
            if CourseParticipant.objects.filter(course=course, person=person).exists():
                raise serializers.ValidationError({
                    "person": f"La persona '{person}' ya está registrada en este curso."
                })

            # B. Reglas de Negocio para Estudiantes NUEVOS
            if role == CourseParticipant.Role.STUDENT:
                
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
    
    # 🚨 CAMBIO CRÍTICO: De IntegerField a SerializerMethodField
    enrolled_count = serializers.SerializerMethodField() 
    
    is_full = serializers.BooleanField(read_only=True)
    modality_display = serializers.CharField(source='get_modality_display', read_only=True)
    status_name = serializers.CharField(source='get_status_display', read_only=True)
    
    # Anidaciones (para la vista de detalle)
    resources = CourseResourceSerializer(many=True, read_only=True)
    sessions = CourseSessionSerializer(many=True, read_only=True)
    
    # SerializerMethodField (Instructores/Estudiantes separados)
    instructors = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = '__all__'
    
    # --- MÉTODO PARA CALCULAR EL CUPO OFICIAL ---
    def get_enrolled_count(self, obj):
        """
        Calcula el número de estudiantes que ocupan un cupo oficialmente (Inscrito o Aprobado).
        """
        # Aseguramos que solo contamos a los estudiantes, no a los instructores.
        # Contamos a los que están oficialmente inscritos (ENR)
        
        return obj.participants.filter(
            role=CourseParticipant.Role.STUDENT, 
            enrollment_status=CourseParticipant.EnrollmentStatus.ENROLLED
        ).count()
    
    # 🚨 INTEGRACIÓN DE LIMPIEZA Y UNICIDAD EN EL MODELO PRINCIPAL 🚨
    def validate_name(self, value):
        cleaned_value = title_case_cleaner(validate_text_with_spaces(value, 'Nombre'))
        validate_min_length(cleaned_value, 2)
        return check_uniqueness(Course, 'name', cleaned_value, self.instance, error_msg="Ya existe un curso con este nombre.")

    def validate_description(self, value):
        return sentence_case_cleaner(value)
    
    def save(self, **kwargs):
        if 'name' in self.validated_data:
            self.validated_data['name'] = title_case_cleaner(self.validated_data['name'])
        if 'description' in self.validated_data:
            self.validated_data['description'] = sentence_case_cleaner(self.validated_data['description'])
        return super().save(**kwargs)

    def get_instructors(self, obj):
        qs = obj.participants.filter(role=CourseParticipant.Role.INSTRUCTOR).select_related('person')
        return ParticipantListSerializer(qs, many=True).data

    def get_students(self, obj):
        qs = obj.participants.filter(role=CourseParticipant.Role.STUDENT).select_related('person')
        return ParticipantListSerializer(qs, many=True).data