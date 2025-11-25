from django.db import models

# Configuración de mensajes de error
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}

class Department(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True,
        error_messages=UNIQUE_ERR_MSG
    )
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sub_departments',
        help_text="Departamento superior al que reporta este departamento."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.name

class JobTitle(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True,
        error_messages=UNIQUE_ERR_MSG
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.name

class Position(models.Model):
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    job_title = models.ForeignKey(JobTitle, on_delete=models.SET_NULL, null=True)
    vacancies = models.PositiveIntegerField(default=1, help_text="Número de vacantes disponibles")
    
    # Validaremos que una posición no se reporte a sí misma
    manager_position = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='direct_reports',
        help_text="Posición a la que reporta directamente (Jefe Inmediato)."
    )
    
    name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Nombre descriptivo opcional, ej: 'Gerente de Finanzas (VE)'"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Opcional: Evitar duplicados si defines que solo puede haber un "Gerente" en "Finanzas"
        # unique_together = ('department', 'job_title') 
        pass

    def __str__(self):
        return self.name or f"{self.job_title} ({self.department})"

class PositionObjective(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='objectives')
    description = models.TextField(help_text="Un objetivo de la posición")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.description[:50]

class PositionRequirement(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='requirements')
    description = models.TextField(help_text="Un requisito de la posición")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.description[:50]