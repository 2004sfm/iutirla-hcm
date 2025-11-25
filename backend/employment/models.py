from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

# Importaciones de otras apps
from core.models import Person
from organization.models import Position

# Configuración de mensajes de error
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}

# --- 1. MODELOS DE CATÁLOGO (Tal como los tenías) ---

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

    is_active_relationship = models.BooleanField(
        default=True,
        verbose_name="¿Es vinculación activa?",
        help_text="Si está marcado, este estatus cuenta como que el empleado ocupa el cargo (ej: Activo, Reposo). Si no (ej: Finalizado), libera el cargo."
    )
    def __str__(self): return self.name


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

    # Usamos PROTECT para evitar borrar catálogos en uso
    role = models.ForeignKey(
        Role, 
        on_delete=models.PROTECT, 
        related_name='employments',
        verbose_name="Rol Funcional"
    )
    
    employment_type = models.ForeignKey(
        EmploymentType, 
        on_delete=models.PROTECT,
        related_name='employments',
        verbose_name="Tipo de Contrato"
    )
    
    # Fuente de verdad del estatus actual
    current_status = models.ForeignKey(
        EmploymentStatus, 
        on_delete=models.PROTECT,
        related_name='active_employments',
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

    # Lógica interna para detectar cambios
    __original_status = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Guardamos el ID del estatus original
        self.__original_status = self.current_status_id

    class Meta:
        verbose_name = "Expediente Laboral"
        ordering = ['-hire_date']

    def __str__(self):
        return f"{self.person} - {self.position}"

    def clean(self):
        # 1. Validar Fechas
        if self.end_date and self.hire_date and self.end_date < self.hire_date:
            raise ValidationError({'end_date': "La fecha de egreso no puede ser anterior a la fecha de ingreso."})

        # 2. VALIDACIÓN DE INTEGRIDAD (Usando la bandera booleana)
        
        # Si el estatus que intentamos guardar se considera "Activo/Vigente"...
        if self.current_status and self.current_status.is_active_relationship:
            
            # Buscamos conflictos:
            duplicates = Employment.objects.filter(
                person=self.person,
                position=self.position,
                # FILTRO ELEGANTE: Solo buscamos otros contratos que TAMBIÉN sean vigentes
                current_status__is_active_relationship=True
            ).exclude(pk=self.pk) # Nos excluimos a nosotros mismos si estamos editando

            if duplicates.exists():
                conflict = duplicates.first()
                raise ValidationError({
                    'current_status': f"Conflicto: {self.person} ya tiene un contrato vigente ({conflict.current_status.name}) en el cargo '{self.position}'. Debe finalizar el anterior primero."
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # 2. LÓGICA DE FECHA DE FIN AUTOMÁTICA (Lo nuevo)
        if self.current_status:
            # Si el estatus NO es vigente (es finalizado/renuncia)...
            if not self.current_status.is_active_relationship:
                # ... y el usuario no puso fecha...
                if not self.end_date:
                    self.end_date = timezone.now().date() # ¡Asignamos HOY!
            
            # (Opcional) Si reactivas al empleado, limpiamos la fecha de fin

        # 3. DETECCIÓN DE CAMBIOS (Tu código original)
        is_created = self.pk is None
        
        # Verificamos si el ID del estatus cambió respecto al original cargado en __init__
        # Usamos getattr por seguridad en caso de que __init__ no haya corrido (casos raros)
        original_status = getattr(self, '_Employment__original_status', None) 
        # O si usaste self.__original_status en __init__, usa esa variable:
        # status_changed = self.current_status_id != self.__original_status
        
        # Suponiendo que mantienes la lógica del __init__ que definimos antes:
        status_changed = self.current_status_id != self.__original_status

        # 4. GUARDADO REAL EN BASE DE DATOS
        super().save(*args, **kwargs)
        
        # 5. CREACIÓN DEL LOG (Tu código original)
        # Se hace DESPUÉS del super().save() para asegurar que tenemos un ID válido
        if is_created or status_changed:
            self._create_status_log(is_created)
            # Actualizamos el estado original en memoria para futuras ediciones en esta misma instancia
            self.__original_status = self.current_status_id

    def _create_status_log(self, is_created):
        # 1. CASO: NUEVO INGRESO
        if is_created:
            reason_text = "Ingreso inicial / Contratación"
        
        # 2. CASO: FINALIZACIÓN DE CONTRATO (Salida)
        # Verificamos si el estatus actual indica cierre (is_active_relationship=False)
        elif self.current_status and not self.current_status.is_active_relationship:
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
    # Ahora es ForeignKey porque EmploymentStatus es un modelo
    status = models.ForeignKey(
        EmploymentStatus, 
        on_delete=models.PROTECT
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
        return f"{self.employment} - {self.status} ({self.start_date})"