from django.db import models
from core.models import Person
from organization.models import Position # Asumo que esta app existe o existirá

# Configuración de mensajes de error
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}

class Role(models.Model):
    name = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Manager, Supervisor, Employee",
        error_messages=UNIQUE_ERR_MSG
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.name

class EmploymentType(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        help_text="Ej: Período de Prueba, Tiempo Indefinido",
        error_messages=UNIQUE_ERR_MSG
    )
    def __str__(self): return self.name

class EmploymentStatus(models.Model):
    name = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Ej: Activo, En Reposo, Suspendido, Finalizado",
        error_messages=UNIQUE_ERR_MSG
    )
    def __str__(self): return self.name

class Employment(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='employments')
    position = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True, related_name='employments')
    
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    employment_type = models.ForeignKey(EmploymentType, on_delete=models.SET_NULL, null=True)
    
    hire_date = models.DateField(verbose_name="Fecha de Contratación")
    end_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Fecha de fin de contrato (para 'Tiempo Determinado' o 'Prueba')"
    )
    
    # global_info_country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.person} - {self.position or 'Sin Cargo'}"

class EmploymentStatusHistory(models.Model):
    employment = models.ForeignKey(Employment, on_delete=models.CASCADE, related_name='status_history')
    status = models.ForeignKey(EmploymentStatus, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField(help_text="Fecha de inicio de este estatus")
    end_date = models.DateField(null=True, blank=True, help_text="Fecha de fin (NULL si es el estatus actual)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employment} - {self.status} (desde {self.start_date})"