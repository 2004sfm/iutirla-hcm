from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

# Importaciones de otras apps
from core.models import Person
from organization.models import Position

# Configuración de mensajes de error
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}

# --- 1. CHOICES (Reemplazan los modelos de catálogo) ---

class RoleChoices(models.TextChoices):
    EMPLOYEE = 'EMP', 'Empleado'
    MANAGER = 'MGR', 'Manager'

class EmploymentTypeChoices(models.TextChoices):
    PERMANENT = 'FIJ', 'Fijo'
    TEMPORARY = 'TMP', 'Temporal'
    INTERNSHIP = 'PAS', 'Pasantía'

class EmploymentStatusChoices(models.TextChoices):
    ACTIVE = 'ACT', 'Activo'
    SUSPENDED = 'SUS', 'Suspendido'
    LEAVE = 'PER', 'De Permiso'
    REST = 'REP', 'Reposo'
    TERMINATED = 'FIN', 'Finalizado'
    RESIGNATION = 'REN', 'Renuncia'
    DISMISSAL = 'DES', 'Despido'
    CANCELLED = 'ANU', 'Anulado'

class HierarchicalRoleChoices(models.TextChoices):
    """Rol jerárquico dentro de un departamento"""
    MANAGER = 'MGR', 'Gerente'
    EMPLOYEE = 'EMP', 'Empleado'


def is_active_status(status_value):
    """
    Determina si un estatus representa una vinculación activa.
    Esto reemplaza el campo is_active_relationship del modelo anterior.
    """
    return status_value in [
        EmploymentStatusChoices.ACTIVE,
        EmploymentStatusChoices.SUSPENDED,
        EmploymentStatusChoices.LEAVE,
        EmploymentStatusChoices.REST,
    ]


# --- 2. MODELO PRINCIPAL (CONTRATO) ---

class Employment(models.Model):
    class ExitReason(models.TextChoices):
        RESIGNATION = 'REN', 'Renuncia Voluntaria'
        DISMISSAL = 'DES', 'Despido / Cese'
        END_CONTRACT = 'FIN', 'Fin de Contrato (Tiempo Cumplido)'
        RETIREMENT = 'JUB', 'Jubilación'
        DEATH = 'FAL', 'Fallecimiento'
        OTHER = 'OTR', 'Otro Motivo'

    # 1. EL DATO DURO (Para Estadísticas)
    exit_reason = models.CharField(
        max_length=3,
        choices=ExitReason.choices,
        null=True, blank=True,
        verbose_name="Motivo de Salida"
    )
    
    # 2. EL DATO BLANDO (Para Contexto)
    exit_notes = models.TextField(
        null=True, blank=True,
        verbose_name="Observaciones",
        help_text="Detalle o carta de renuncia."
    )

    person = models.ForeignKey(
        Person, 
        on_delete=models.CASCADE, 
        related_name='employments',
        verbose_name="Colaborador"
    )
    
    position = models.ForeignKey(
        Position, 
        on_delete=models.PROTECT, 
        related_name='employments',
        verbose_name="Cargo / Posición"
    )

    # CAMPOS CON CHOICES
    role = models.CharField(
        max_length=3,
        choices=RoleChoices.choices,
        default=RoleChoices.EMPLOYEE,
        verbose_name="Rol Funcional"
    )
    
    employment_type = models.CharField(
        max_length=3,
        choices=EmploymentTypeChoices.choices,
        default=EmploymentTypeChoices.PERMANENT,
        verbose_name="Tipo de Contrato"
    )
    
    current_status = models.CharField(
        max_length=3,
        choices=EmploymentStatusChoices.choices,
        default=EmploymentStatusChoices.ACTIVE,
        verbose_name="Estatus Actual"
    )
    
    hire_date = models.DateField(verbose_name="Fecha de Contratación")
    
    end_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Fecha de fin de contrato (para 'Tiempo Determinado' o 'Prueba')"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Historial de cambios
    history = HistoricalRecords()

    # Lógica interna para detectar cambios
    __original_status = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Guardamos el valor del estatus original
        self.__original_status = self.current_status

    class Meta:
        verbose_name = "Expediente Laboral"
        ordering = ['-hire_date']

    def __str__(self):
        return f"{self.person} - {self.position}"

    def clean(self):
        # 1. Validar Fechas
        if self.end_date and self.hire_date and self.end_date < self.hire_date:
            raise ValidationError({'end_date': "La fecha de egreso no puede ser anterior a la fecha de ingreso."})

        # 2. VALIDACIÓN DE INTEGRIDAD (Usando is_active_status helper)
        
        # Si el estatus que intentamos guardar se considera "Activo/Vigente"...
        if self.current_status and is_active_status(self.current_status):
            
            # Buscamos conflictos: otros contratos activos del mismo empleado en la misma posición
            duplicates = Employment.objects.filter(
                person=self.person,
                position=self.position,
            ).exclude(pk=self.pk)  # Nos excluimos a nosotros mismos si estamos editando
            
            # Filtrar solo los que tienen estatus activo
            duplicates = [e for e in duplicates if is_active_status(e.current_status)]

            if duplicates:
                conflict = duplicates[0]
                raise ValidationError({
                    'current_status': f"Conflicto: {self.person} ya tiene un contrato vigente ({conflict.get_current_status_display()}) en el cargo '{self.position}'. Debe finalizar el anterior primero."
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # 2. LÓGICA DE FECHA DE FIN AUTOMÁTICA (Lo nuevo)
        if self.current_status:
            # Si el estatus NO es vigente (es finalizado/renuncia)...
            if not is_active_status(self.current_status):
                # ... y el usuario no puso fecha...
                if not self.end_date:
                    self.end_date = timezone.now().date() # ¡Asignamos HOY!
            
            # (Opcional) Si reactivas al empleado, limpiamos la fecha de fin

        # 3. DETECCIÓN DE CAMBIOS (Tu código original)
        is_created = self.pk is None
        
        # Verificamos si el valor del estatus cambió respecto al original cargado en __init__
        # Como current_status ahora es CharField, comparamos valores directamente
        original_status = getattr(self, '_Employment__original_status', None) 
        status_changed = self.current_status != self.__original_status

        # 4. DECREMENTO AUTOMÁTICO DE VACANTES (NUEVO)
        # Si es un nuevo contrato y el estatus es activo (ocupa silla)
        if is_created and is_active_status(self.current_status):
            # Bloqueamos la posición para evitar condiciones de carrera
            # Nota: select_for_update() requiere estar dentro de una transacción.
            # Como save() puede llamarse fuera, usamos F() expressions o asumimos transacción externa.
            # Para mayor seguridad y simplicidad aquí, usamos lógica directa, pero lo ideal es que
            # la vista/servicio envuelva esto en transaction.atomic()
            
            if self.position.vacancies > 0:
                self.position.vacancies -= 1
                self.position.save()
            # Si es 0, técnicamente no debería haber pasado la validación del serializer/clean,
            # pero por seguridad no restamos más allá de 0.

        # 5. GUARDADO REAL EN BASE DE DATOS
        super().save(*args, **kwargs)
        
        # 6. CREACIÓN DEL LOG (Tu código original)
        # Se hace DESPUÉS del super().save() para asegurar que tenemos un ID válido
        if is_created or status_changed:
            self._create_status_log(is_created)
            # Actualizamos el estado original en memoria para futuras ediciones en esta misma instancia
            self.__original_status = self.current_status

    def delete(self, *args, **kwargs):
        # 1. RESTITUCIÓN DE VACANTES
        # Si el contrato que se borra estaba ocupando plaza (activo), devolvemos la vacante.
        if is_active_status(self.current_status):
            self.position.vacancies += 1
            self.position.save()
            
        super().delete(*args, **kwargs)

    def _create_status_log(self, is_created):
        # 1. CASO: NUEVO INGRESO
        if is_created:
            reason_text = "Ingreso inicial / Contratación"
        
        # 2. CASO: FINALIZACIÓN DE CONTRATO (Salida)
        # Verificamos si el estatus actual indica cierre (usando helper function)
        elif self.current_status and not is_active_status(self.current_status):
            # Construimos el mensaje con los datos de salida que acabamos de guardar
            parts = []
            
            # A. Agregamos la categoría (ej. "Renuncia Voluntaria")
            if self.exit_reason:
                # get_FOO_display() es un método mágico de Django para obtener el texto del Choice
                parts.append(self.get_exit_reason_display())
            
            # B. Agregamos la nota específica si existe
            if self.exit_notes:
                parts.append(f"({self.exit_notes})")
            
            # Unimos todo. Si no hay nada, ponemos un default.
            reason_text = " ".join(parts) if parts else "Finalización de contrato (Sin motivo especificado)"

        # 3. CASO: CAMBIO ADMINISTRATIVO (Ej. Activo -> Suspendido, o Prueba -> Fijo)
        else:
            reason_text = "Cambio de estatus administrativo / Actualización"

        # --- GUARDAR EL LOG ---
        EmploymentStatusLog.objects.create(
            employment=self,
            status=self.current_status,
            start_date=timezone.now().date(), # O self.end_date si prefieres la fecha del evento
            reason=reason_text # <--- Aquí guardamos el texto calculado
        )
        
class EmploymentStatusLog(models.Model):
    employment = models.ForeignKey(
        Employment, 
        on_delete=models.CASCADE, 
        related_name='status_logs'
    )
    # Ahora es CharField porque usamos Choices
    status = models.CharField(
        max_length=3,
        choices=EmploymentStatusChoices.choices,
        verbose_name="Estatus"
    )
    start_date = models.DateField(
        default=timezone.now,
        help_text="Fecha de inicio de este estatus"
    )
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Historial de Estatus"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employment} - {self.get_status_display()} desde {self.start_date}"



# --- 4. ROL JERÁRQUICO EN DEPARTAMENTO ---

class EmploymentDepartmentRole(models.Model):
    """
    Define el rol jerárquico de un empleado en un departamento específico
    durante su contrato activo.
    
    Esto permite:
    - Que un empleado sea gerente de un departamento
    - Histórico de cambios de rol jerárquico
    - Roles temporales (con fecha de inicio y fin)
    - Roles matriciales (un empleado puede tener roles en múltiples departamentos)
    """
    employment = models.ForeignKey(
        Employment,
        on_delete=models.CASCADE,
        related_name='department_roles',
        verbose_name="Contrato",
        help_text="Contrato al que pertenece este rol jerárquico"
    )
    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.CASCADE,
        related_name='employment_roles',
        verbose_name="Departamento",
        help_text="Departamento en el que ejerce este rol"
    )
    hierarchical_role = models.CharField(
        max_length=3,
        choices=HierarchicalRoleChoices.choices,
        default=HierarchicalRoleChoices.EMPLOYEE,
        verbose_name="Rol Jerárquico",
        help_text="Rol dentro del departamento (Gerente o Empleado)"
    )
    start_date = models.DateField(
        default=timezone.now,
        verbose_name="Fecha de Inicio",
        help_text="Inicio del rol jerárquico en este departamento"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Fin",
        help_text="Fin del rol jerárquico (NULL si es actual)"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notas",
        help_text="Observaciones sobre la asignación del rol"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Historial de cambios
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Rol Jerárquico en Departamento"
        verbose_name_plural = "Roles Jerárquicos en Departamentos"
        unique_together = ('employment', 'department', 'start_date')
        ordering = ['-start_date']

    def __str__(self):
        role_display = self.get_hierarchical_role_display()
        return f"{self.employment.person} - {role_display} de {self.department.name}"

    def clean(self):
        """Validaciones personalizadas"""
        super().clean()
        
        # Validar que el departamento del employment coincide con el department del rol
        # Validar que el departamento del employment coincide con el department del rol - REMOVED for Matrix Support
        # if self.employment.position and self.employment.position.department != self.department:
        #     raise ValidationError({
        #         'department': f'El departamento debe coincidir con el departamento de la posición del empleado ({self.employment.position.department.name})'
        #     })
        
        # Validar que end_date sea posterior a start_date
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })

    @property
    def is_current(self):
        """Verifica si el rol está actualmente vigente"""
        return self.end_date is None or self.end_date >= timezone.now().date()


# --- 5. ROL JERÁRQUICO POR PERSONA EN DEPARTAMENTO (MATRIZ) ---

class PersonDepartmentRole(models.Model):
    """
    Define el rol jerárquico de una persona en un departamento específico,
    independientemente de su contrato de trabajo.
    
    Este modelo permite organizaciones matriciales donde una persona puede
    tener un rol jerárquico en un departamento diferente al de su posición formal.
    
    Ventajas sobre EmploymentDepartmentRole:
    - Más flexible: Permite roles cruzados entre departamentos
    - Más simple: Vinculación directa Person→Department
    - Soporta matriz: Una persona en IT puede ser gerente de Finanzas
    """
    person = models.ForeignKey(
        'core.Person',
        on_delete=models.CASCADE,
        related_name='department_roles',
        verbose_name="Persona",
        help_text="Persona que ejerce este rol jerárquico"
    )
    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.CASCADE,
        related_name='person_roles',
        verbose_name="Departamento",
        help_text="Departamento en el que ejerce este rol"
    )
    hierarchical_role = models.CharField(
        max_length=3,
        choices=HierarchicalRoleChoices.choices,
        default=HierarchicalRoleChoices.EMPLOYEE,
        verbose_name="Rol Jerárquico",
        help_text="Rol dentro del departamento (Gerente o Empleado)"
    )
    start_date = models.DateField(
        default=timezone.now,
        verbose_name="Fecha de Inicio",
        help_text="Inicio del rol jerárquico en este departamento"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Fin",
        help_text="Fin del rol jerárquico (NULL si es actual)"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notas",
        help_text="Observaciones sobre la asignación del rol"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Historial de cambios
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Rol Jerárquico por Persona"
        verbose_name_plural = "Roles Jerárquicos por Persona"
        unique_together = ('person', 'department', 'start_date')
        ordering = ['-start_date']

    def __str__(self):
        role_display = self.get_hierarchical_role_display()
        return f"{self.person.full_name} - {role_display} de {self.department.name}"

    def clean(self):
        """Validaciones personalizadas"""
        super().clean()
        
        # Validar que end_date sea posterior a start_date
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })

    @property
    def is_current(self):
        """Verifica si el rol está actualmente vigente"""
        return self.end_date is None or self.end_date >= timezone.now().date()