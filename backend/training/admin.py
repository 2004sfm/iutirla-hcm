from django.contrib import admin
from . import models
from django.db.models import Count

# --- 1. INLINES (Tablas anidadas dentro del formulario del Curso) ---

class ParticipantInline(admin.TabularInline):
    """Permite gestionar instructores y estudiantes desde la página del Curso."""
    model = models.CourseParticipant
    extra = 1
    # raw_id_fields es ideal para FKs a modelos grandes (como Person)
    raw_id_fields = ('person',) 
    
    # Campos que el usuario puede ver, pero no editar en el inline
    readonly_fields = ('get_person_name',) 
    
    # Campos a mostrar en la tabla (usamos un método para mostrar el nombre completo)
    fields = ('person', 'get_person_name', 'role', 'status', 'grade')
    
    # Método auxiliar para mostrar el nombre completo de la persona
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
        'get_modality_display', 
        'status', 
        'start_date', 
        'end_date', 
        'max_participants', 
        'enrolled_count', # Propiedad calculada
        'is_full'         # Propiedad calculada
    )
    
    # Campos para filtrar la lista
    list_filter = ('status', 'modality', 'start_date')
    
    # Campos para búsqueda rápida
    search_fields = ('name', 'description')
    
    # Campos de solo lectura
    readonly_fields = ('enrolled_count', 'is_full') 

    # Agregamos las secciones inlines al formulario de edición
    inlines = [ResourceInline, SessionInline, ParticipantInline]


@admin.register(models.CourseParticipant)
class CourseParticipantAdmin(admin.ModelAdmin):
    """Admin para gestionar inscripciones individuales."""
    list_display = ('person', 'course', 'role', 'status', 'grade')
    list_filter = ('role', 'status', 'course')
    search_fields = ('person__first_name', 'course__name')
    # Permite navegar a la persona y al curso
    list_select_related = ('person', 'course')


@admin.register(models.AttendanceRecord)
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

admin.site.register(models.CourseSession)
admin.site.register(models.CourseResource)