from django.contrib import admin
from django.db.models import Count, DecimalField
from django.utils.html import format_html
from . import models

# --- 1. INLINE (Para ver las preguntas dentro de la boleta) ---

class ReviewDetailInline(admin.TabularInline):
    """Muestra las competencias evaluadas dentro del formulario de PerformanceReview."""
    model = models.ReviewDetail
    extra = 0
    raw_id_fields = ('competency',)
    fields = ('competency', 'score', 'comment')
    readonly_fields = ('competency',)
    min_num = 1 # Debe haber al menos una competencia si se crea manualmente


# --- 2. REGISTRO PRINCIPAL DE EVALUACIONES ---

@admin.register(models.PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'employee_name', # Método para mostrar el nombre
        'evaluator_name',
        'status',
        'final_score',
        'period',
        'created_at',
    )
    list_filter = ('status', 'period', 'evaluator')
    search_fields = ('employment__person__first_name', 'employment__person__paternal_surname', 'period__name')
    
    # Detalle de la boleta anidado
    inlines = [ReviewDetailInline]
    
    # Campos que son propiedades calculadas o navegadas
    readonly_fields = ('final_score', 'employee_name', 'evaluator_name')

    # Navegación a través de las relaciones (evita N+1 queries)
    list_select_related = ('employment__person', 'evaluator', 'period') 
    
    # Métodos para list_display (extraídos del Serializer para el Admin)
    def employee_name(self, obj):
        return str(obj.employment.person)
    employee_name.short_description = 'Empleado'

    def evaluator_name(self, obj):
        return str(obj.evaluator)
    evaluator_name.short_description = 'Evaluador'


# --- 3. CONFIGURACIÓN DE CATÁLOGOS ---

@admin.register(models.Competency)
class CompetencyAdmin(admin.ModelAdmin):
    """Configuración de las preguntas/criterios a evaluar."""
    list_display = ('name', 'is_global', 'description')
    list_filter = ('is_global',)
    search_fields = ('name',)
    
    # CLAVE: Permite seleccionar múltiples JobTitles para competencias específicas
    filter_horizontal = ('job_titles',) 
    
    # Los campos de Global y JobTitles solo se muestran si aplican
    fieldsets = (
        (None, {'fields': ('name', 'description')}),
        ('SEGMENTACIÓN', {
            'fields': ('is_global', 'job_titles'),
            'description': 'Si es global, aplica a todos. Si es específico, seleccione los cargos.',
        }),
    )

@admin.register(models.EvaluationPeriod)
class EvaluationPeriodAdmin(admin.ModelAdmin):
    """Admin para gestionar los ciclos y disparar la generación masiva."""
    list_display = ('name', 'start_date', 'end_date', 'is_active', 'review_count')
    list_filter = ('is_active', 'start_date')
    
    # Agrega un campo calculado de conteo de evaluaciones
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        # Anotamos cuántas revisiones se crearon para cada periodo
        return queryset.annotate(
            _review_count=Count('performance_review')
        )
    
    def review_count(self, obj):
        return obj._review_count
    review_count.short_description = 'Boletas Creadas'


# --- 4. REGISTRO DE DETALLES ---
@admin.register(models.ReviewDetail)
class ReviewDetailAdmin(admin.ModelAdmin):
    list_display = ('review', 'competency', 'score')
    list_filter = ('competency', 'review__period')
    search_fields = ('review__employment__person__first_name', 'competency__name')
    raw_id_fields = ('review', 'competency')