from django.db import models
from simple_history.models import HistoricalRecords

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subdepartments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Historial de cambios
    history = HistoricalRecords()

    def __str__(self):
        return self.name

class JobTitle(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # description field removed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Historial de cambios
    history = HistoricalRecords()

    def __str__(self):
        return self.name

class Position(models.Model):
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    job_title = models.ForeignKey(JobTitle, on_delete=models.SET_NULL, null=True)
    vacancies = models.PositiveIntegerField(default=1, help_text="Número de vacantes disponibles")
    
    # Objetivo del cargo (antes era un modelo separado)
    objective = models.TextField(
        blank=True, 
        null=True,
        help_text="Objetivo general del cargo",
        verbose_name="Objetivo"
    )
    
    # Reportes Matriciales: Una posición puede reportar a múltiples jefes
    manager_positions = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='direct_reports',
        help_text="Posiciones a las que reporta directamente (Jefes Inmediatos)."
    )

    is_manager = models.BooleanField(
        default=False,
        verbose_name="Es Gerencial",
        help_text="Indica si esta posición tiene responsabilidades gerenciales."
    )
    
    # name field removed
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Historial de cambios
    history = HistoricalRecords()

    class Meta:
        unique_together = ('department', 'job_title')

    @property
    def title(self):
        """Nombre legible del cargo"""
        return f"{self.job_title.name} - {self.department.name}" if self.job_title and self.department else "Posición sin título"

    def __str__(self):
        if not self.job_title or not self.department:
            return "Posición incompleta"
        return f"{self.job_title.name} - {self.department.name}"


class PositionRequirement(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='requirements')
    description = models.TextField(help_text="Un requisito de la posición")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.description[:50]

class PositionFunction(models.Model):
    """Funciones y responsabilidades de un cargo"""
    position = models.ForeignKey(
        Position, 
        on_delete=models.CASCADE, 
        related_name='functions',
        help_text="Posición a la que pertenece esta función"
    )
    description = models.TextField(help_text="Descripción de la función o responsabilidad")
    order = models.PositiveIntegerField(
        default=0, 
        help_text="Orden de visualización (menor primero)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = "Función de Cargo"
        verbose_name_plural = "Funciones de Cargos"
        
    def __str__(self):
        return f"{self.position} - Función #{self.order + 1}"