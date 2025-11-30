from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from simple_history.models import HistoricalRecords
from organization.models import Position, Department

# Mensajes de error estándar
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}


class JobPosting(models.Model):
    """Vacante publicable con configuración dinámica de formulario"""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Borrador'),
        ('PUBLISHED', 'Publicada'),
        ('CLOSED', 'Cerrada'),
        ('FROZEN', 'Congelada'),
    ]
    
    # Información básica
    title = models.CharField(
        max_length=200,
        verbose_name="Título de la Vacante",
        help_text="Ej: Desarrollador Frontend Senior"
    )
    description = models.TextField(
        verbose_name="Descripción",
        help_text="Descripción completa de la vacante"
    )
    
    # Relaciones
    position = models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Posición",
        help_text="Posición organizacional a la que corresponde"
    )
    
    # Detalles de la oferta
    location = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Ubicación",
        help_text="Ej: Caracas, Venezuela / Remoto"
    )
    
    # Configuración dinámica del formulario público
    ask_education = models.BooleanField(
        default=False,
        verbose_name="Solicitar Educación",
        help_text="¿El formulario debe pedir información educativa?"
    )

    
    # Estado y fechas
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='DRAFT',
        verbose_name="Estado"
    )
    published_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Publicación"
    )
    closing_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Cierre"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Historial de cambios
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = "Vacante"
        verbose_name_plural = "Vacantes"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def clean(self):
        """Validaciones personalizadas"""
        if self.status == 'PUBLISHED' and not self.published_date:
            self.published_date = timezone.now().date()
        
        if self.closing_date and self.published_date:
            if self.closing_date < self.published_date:
                raise ValidationError("La fecha de cierre no puede ser anterior a la de publicación")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Candidate(models.Model):
    """Candidato temporal (no es empleado aún)"""
    
    STAGE_CHOICES = [
        ('NEW', 'Nuevo'),
        ('REV', 'En Revisión'),
        ('INT', 'Entrevista/Pruebas'),
        ('OFF', 'Oferta Enviada'),
        ('HIRED', 'Contratado'),
        ('REJ', 'Rechazado'),
        ('POOL', 'Banco de Elegibles'),
    ]
    
    # Relación con la vacante
    job_posting = models.ForeignKey(
        JobPosting,
        on_delete=models.CASCADE,
        related_name='candidates',
        verbose_name="Vacante"
    )
    
    # Datos personales básicos
    first_name = models.CharField(
        max_length=100,
        verbose_name="Nombre"
    )
    last_name = models.CharField(
        max_length=100,
        verbose_name="Apellido"
    )
    email = models.EmailField(
        verbose_name="Correo Electrónico"
    )
    
    # Teléfono - Nuevo formato (separado)
    phone_area_code = models.ForeignKey(
        'core.PhoneCarrierCode',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Código de Área"
    )
    phone_subscriber = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name="Número de Suscriptor"
    )
    
    # Teléfono - Formato antiguo (para retrocompatibilidad)
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Teléfono (Completo)"
    )
    
    national_id = models.CharField(
        max_length=20,
        verbose_name="Cédula/ID Nacional",
        help_text="Documento de identidad"
    )
    
    avatar = models.ImageField(
        upload_to='candidates/avatars/',
        null=True,
        blank=True,
        verbose_name="Foto de Perfil"
    )
    
    # CV obligatorio
    cv_file = models.FileField(
        upload_to='candidates/cv/',
        verbose_name="Currículum (PDF)",
        help_text="Archivo PDF del currículum"
    )
    
    # Campos dinámicos opcionales (según configuración de JobPosting)
    education_details = models.TextField(
        blank=True,
        null=True,
        verbose_name="Detalles de Educación",
        help_text="Información educativa (JSON o texto)"
    )
    
    # Pipeline (máquina de estados)
    stage = models.CharField(
        max_length=5,
        choices=STAGE_CHOICES,
        default='NEW',
        verbose_name="Etapa"
    )
    
    # Notas del reclutador
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notas Internas",
        help_text="Comentarios del reclutador sobre el candidato"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Historial de cambios
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = "Candidato"
        verbose_name_plural = "Candidatos"
        ordering = ['-created_at']
        # Evitar duplicados: misma persona aplicando a la misma vacante
        unique_together = [('job_posting', 'email')]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.job_posting.title}"

    def save(self, *args, **kwargs):
        # Auto-populate legacy phone field
        if self.phone_area_code and self.phone_subscriber:
            self.phone = f"{self.phone_area_code.code}-{self.phone_subscriber}"
        super().save(*args, **kwargs)


class CandidateEducation(models.Model):
    """Educación del candidato (se migrará a PersonEducation al contratar)"""
    
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='education',
        verbose_name="Candidato"
    )
    
    school_name = models.CharField(
        max_length=255,
        verbose_name="Institución"
    )
    level_name = models.CharField(
        max_length=100,
        verbose_name="Nivel Educativo",
        help_text="Ej: Ingeniería, Licenciatura, Maestría"
    )
    field_name = models.CharField(
        max_length=100,
        verbose_name="Área de Estudio",
        help_text="Ej: Informática, Administración"
    )
    start_date = models.DateField(
        verbose_name="Fecha de Inicio"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Finalización",
        help_text="Dejar vacío si está en curso"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Educación de Candidato"
        verbose_name_plural = "Educación de Candidatos"
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.school_name} - {self.level_name}"


class CandidateLog(models.Model):
    """Registro de auditoría para cambios en candidatos"""
    
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="Candidato"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Usuario"
    )
    action = models.CharField(
        max_length=50,
        verbose_name="Acción"
    )
    details = models.TextField(
        blank=True,
        null=True,
        verbose_name="Detalles"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Registro de Actividad"
        verbose_name_plural = "Registros de Actividad"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.candidate} - {self.action} - {self.timestamp}"



