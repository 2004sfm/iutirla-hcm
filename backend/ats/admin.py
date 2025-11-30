from django.contrib import admin
from .models import JobPosting, Candidate, CandidateEducation


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ['title', 'position', 'status', 'published_date', 'closing_date', 'created_at']
    list_filter = ['status', 'ask_education']
    search_fields = ['title', 'description']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'description', 'position')
        }),
        ('Detalles de la Oferta', {
            'fields': ('location',)
        }),
        ('Configuración del Formulario', {
            'fields': ('ask_education',),
            'description': 'Define qué campos serán requeridos en el formulario público'
        }),
        ('Estado y Fechas', {
            'fields': ('status', 'published_date', 'closing_date')
        }),
    )


class CandidateEducationInline(admin.TabularInline):
    model = CandidateEducation
    extra = 0





@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'job_posting', 'stage', 'created_at']
    list_filter = ['stage', 'job_posting', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'national_id']
    date_hierarchy = 'created_at'
    inlines = [CandidateEducationInline]
    
    fieldsets = (
        ('Vacante', {
            'fields': ('job_posting',)
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'national_id')
        }),
        ('Documentación', {
            'fields': ('cv_file',)
        }),
        ('Información Adicional', {
            'fields': ('education_details',),
            'classes': ('collapse',)
        }),
        ('Pipeline', {
            'fields': ('stage', 'notes')
        }),
    )
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Nombre Completo'
