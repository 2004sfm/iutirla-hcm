from django.contrib import admin
from . import models
from django.db.models import Count

# --- 1. INLINES (Tablas anidadas dentro del formulario del Curso) ---

class ParticipantInline(admin.TabularInline):
    """🔧 REFACTOR: Ahora solo gestiona estudiantes, no instructores."""
    model = models.CourseParticipant
    extra = 1
    raw_id_fields = ('person',) 
    readonly_fields = ('get_person_name',) 
    fields = ('person', 'get_person_name', 'enrollment_status', 'academic_status', 'grade')
    
    def get_person_name(self, obj):
        return str(obj.person)
    get_person_name.short_description = 'Nombre de la Persona'


class SessionInline(admin.TabularInline):
    """Permite gestionar el horario y temas del curso."""
    model = models.CourseSession
    extra = 1
    fields = ('topic', 'date', 'start_time', 'end_time')
    ordering = ('date', 'start_time')


class ResourceInline(admin.TabularInline):
    """Permite gestionar los materiales de apoyo."""
    model = models.CourseResource
    extra = 1
    fields = ('name', 'resource_type', 'file', 'url')


# --- 2. MODEL ADMINS PRINCIPALES ---

@admin.register(models.Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin para el modelo principal Course."""
    
    # Campos a mostrar en la lista de cursos
    list_display = (
        'name', 
        'instructor',  # 🔧 REFACTOR: Nuevo campo directo
        'get_modality_display', 
        'status', 
        'start_date', 
        'end_date', 
        'max_participants', 
        'enrolled_count',
        'is_full'
    )
    
    # Campos para filtrar la lista
    list_filter = ('status', 'modality', 'start_date')
    
    # Campos para búsqueda rápida
    search_fields = ('name', 'description')
    
    # 🔧 REFACTOR: Ahora el instructor es editable directamente
    raw_id_fields = ('instructor',)
    
    # Campos de solo lectura
    readonly_fields = ('enrolled_count', 'is_full') 

    # Agregamos las secciones inlines al formulario de edición
    inlines = [ParticipantInline, SessionInline, ResourceInline]
class AttendanceRecordAdmin(admin.ModelAdmin):
    """Admin para auditar registros de asistencia."""
    list_display = ('session', 'participant_person', 'status', 'notes')
    list_filter = ('status', 'session__course')
    search_fields = ('participant__person__first_name', 'session__topic')

    def participant_person(self, obj):
        return str(obj.participant.person)
    participant_person.short_description = 'Participante'
    
    
# --- 3. REGISTRO DE MODELOS RESTANTES ---
# (Modelos que no necesitan Inlines ni personalización compleja)

# 🆕 NEW: Register hierarchical content models
@admin.register(models.CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    """Admin para módulos del curso."""
    list_display = ('course', 'name', 'order')
    list_filter = ('course',)
    search_fields = ('name', 'description')
    ordering = ('course', 'order')


@admin.register(models.CourseLesson)
class CourseLessonAdmin(admin.ModelAdmin):
    """Admin para lecciones individuales."""
    list_display = ('module', 'title', 'order', 'duration_minutes')
    list_filter = ('module__course',)
    search_fields = ('title', 'content')
    ordering = ('module', 'order')


@admin.register(models.LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    """Admin para el progreso de lecciones por estudiante."""
    list_display = ('enrollment', 'lesson', 'completed', 'completed_at')
    list_filter = ('completed', 'lesson__module__course')
    search_fields = ('enrollment__person__first_name', 'lesson__title')
    readonly_fields = ('completed_at',)


admin.site.register(models.CourseSession)
admin.site.register(models.CourseResource)