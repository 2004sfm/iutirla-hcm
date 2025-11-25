from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import Person
from employment.models import Employment
from organization.models import JobTitle # Importamos JobTitle para la relación

class EvaluationPeriod(models.Model):
    """Define el ciclo de evaluación (Ej: 'Evaluación 2025-I')"""
    name = models.CharField(max_length=100, unique=True)
    start_date = models.DateField(verbose_name="Inicio")
    end_date = models.DateField(verbose_name="Cierre")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        verbose_name = "Periodo de Evaluación"
        ordering = ['-start_date']

    def __str__(self): return self.name

class Competency(models.Model):
    """
    Diccionario de criterios a evaluar.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # LÓGICA DE SEGMENTACIÓN
    is_global = models.BooleanField(
        default=True, 
        verbose_name="¿Es Global?",
        help_text="Si se marca, aplica a todos los empleados."
    )
    
    # Relación con Títulos de Cargo (NO con Posiciones individuales)
    job_titles = models.ManyToManyField(
        JobTitle, 
        blank=True, 
        related_name='specific_competencies',
        verbose_name="Aplica a Cargos Específicos"
    )

    class Meta:
        verbose_name = "Competencia / Criterio"
        verbose_name_plural = "Competencias"

    def __str__(self): return self.name

class PerformanceReview(models.Model):
    """La boleta de evaluación de un CONTRATO específico."""
    
    class Status(models.TextChoices):
        DRAFT = 'BOR', 'Borrador'
        SUBMITTED = 'ENV', 'Enviada / Finalizada'
        ACKNOWLEDGED = 'ACE', 'Aceptada por Empleado'

    period = models.ForeignKey(EvaluationPeriod, on_delete=models.PROTECT)
    
    # Evaluamos al CONTRATO (Employment), para soportar pluriempleo
    employment = models.ForeignKey(
        Employment, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    
    # El evaluador es el JEFE en ese momento
    evaluator = models.ForeignKey(
        Person, 
        on_delete=models.PROTECT, 
        related_name='reviews_given'
    )
    
    final_score = models.DecimalField(
        max_digits=4, decimal_places=2, 
        null=True, blank=True, 
        verbose_name="Promedio Final"
    )
    
    status = models.CharField(max_length=3, choices=Status.choices, default=Status.DRAFT)
    
    feedback_manager = models.TextField(verbose_name="Comentarios del Jefe", blank=True)
    feedback_employee = models.TextField(verbose_name="Comentarios del Empleado", blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Un contrato solo puede ser evaluado una vez por periodo
        unique_together = ('period', 'employment') 
        verbose_name = "Evaluación de Desempeño"
        verbose_name_plural = "Evaluaciones de Desempeño"

    def __str__(self):
        return f"{self.employment.person} - {self.period}"
        
    def calculate_score(self):
        """Recalcula el promedio."""
        details = self.details.all()
        if not details.exists():
            self.final_score = 0
        else:
            total = sum([d.score for d in details])
            self.final_score = total / details.count()
        self.save()

class ReviewDetail(models.Model):
    """Cada pregunta y su respuesta."""
    review = models.ForeignKey(PerformanceReview, on_delete=models.CASCADE, related_name='details')
    competency = models.ForeignKey(Competency, on_delete=models.PROTECT)
    
    score = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        verbose_name="Puntaje (1-5)"
    )
    comment = models.TextField(blank=True, null=True, verbose_name="Observación")

    class Meta:
        unique_together = ('review', 'competency')

    def __str__(self):
        return f"{self.competency}: {self.score}"