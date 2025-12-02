from django.db import models
from django.core.exceptions import ValidationError
from core.models import Person

class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'BOR', 'Borrador'
        SCHEDULED = 'PRO', 'Programado'
        IN_PROGRESS = 'EJE', 'En Ejecución'
        COMPLETED = 'FIN', 'Finalizado'
        CANCELLED = 'CAN', 'Cancelado'

    # NUEVO: Modalidad
    class Modality(models.TextChoices):
        PRESENTIAL = 'PRE', 'Presencial'
        VIRTUAL_SYNC = 'VIR', 'Virtual (En Vivo / Zoom)'
        VIRTUAL_ASYNC = 'ASY', 'Virtual (Autoaprendizaje)'
        HYBRID = 'MIX', 'Híbrido / Mixto'

    name = models.CharField(max_length=200, verbose_name="Nombre del Curso")
    description = models.TextField(blank=True, null=True)

    cover_image = models.ImageField(
        upload_to='courses/covers/', 
        null=True, 
        blank=True,
        verbose_name="Imagen de Portada"
    )
    
    start_date = models.DateField(verbose_name="Fecha Inicio")
    end_date = models.DateField(verbose_name="Fecha Fin")
    
    # NUEVO: Modalidad y Cupo
    modality = models.CharField(max_length=3, choices=Modality.choices, default=Modality.PRESENTIAL)
    max_participants = models.PositiveIntegerField(
        default=20, 
        verbose_name="Cupo Máximo",
        help_text="Límite de estudiantes permitidos."
    )
    
    duration_hours = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=3, choices=Status.choices, default=Status.DRAFT)
    
    # Privacy/Visibility settings
    is_public = models.BooleanField(
        default=True,
        verbose_name="Curso Público",
        help_text="Si es público, todos pueden ver el curso. Si es privado, solo el departamento asignado."
    )
    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
        verbose_name="Departamento",
        help_text="Departamento al que pertenece este curso (solo si es privado)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.name
    
    @property
    def enrolled_count(self):
        # Cuenta solo estudiantes (no instructores)
        return self.participants.filter(role='EST').count()

    @property
    def is_full(self):
        return self.enrolled_count >= self.max_participants


class CourseResource(models.Model):
    """Materiales de apoyo (PDFs, Videos, Links)."""
    
    class Type(models.TextChoices):
        FILE = 'FIL', 'Archivo (PDF/Doc/Img)'
        LINK = 'URL', 'Enlace Externo / Video'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources')
    name = models.CharField(max_length=200, verbose_name="Título del Recurso")
    resource_type = models.CharField(max_length=3, choices=Type.choices, default=Type.FILE)
    
    # Puede ser uno U otro
    file = models.FileField(upload_to='training/resources/', null=True, blank=True)
    url = models.URLField(null=True, blank=True, help_text="Youtube, Drive, Zoom, etc.")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.name


class CourseSession(models.Model):
    """
    Cada una de las clases o sesiones del curso.
    Necesario para tomar asistencia por día.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    topic = models.CharField(max_length=200, verbose_name="Tema / Título de la Sesión")
    date = models.DateField(verbose_name="Fecha de la sesión")
    start_time = models.TimeField(verbose_name="Hora Inicio")
    end_time = models.TimeField(verbose_name="Hora Fin")
    
    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self): return f"{self.course.name} - {self.topic} ({self.date})"


class CourseParticipant(models.Model):
    class Role(models.TextChoices):
        INSTRUCTOR = 'INS', 'Instructor'
        STUDENT = 'EST', 'Estudiante'

    class EnrollmentStatus(models.TextChoices):
        REQUESTED = 'REQ', 'Solicitud Enviada'
        ENROLLED = 'ENR', 'Inscrito'
        REJECTED = 'REJ', 'Solicitud Rechazada'

    class AcademicStatus(models.TextChoices):
        PENDING = 'PEN', 'En Curso'
        PASSED = 'APR', 'Aprobado'
        FAILED = 'REP', 'Reprobado'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='participants')
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='training_courses')
    role = models.CharField(max_length=3, choices=Role.choices, default=Role.STUDENT)
    
    # Nuevos campos de estado separados
    enrollment_status = models.CharField(
        max_length=3, 
        choices=EnrollmentStatus.choices, 
        default=EnrollmentStatus.REQUESTED,
        verbose_name="Estado de Inscripción"
    )
    academic_status = models.CharField(
        max_length=3, 
        choices=AcademicStatus.choices, 
        default=AcademicStatus.PENDING,
        verbose_name="Estado Académico"
    )
    
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        unique_together = ('course', 'person')

    def __str__(self): return f"{self.person} en {self.course}"


class AttendanceRecord(models.Model):
    """Registro de asistencia: Cruce entre Sesión y Participante."""
    
    class Status(models.TextChoices):
        PRESENT = 'PRE', 'Presente'
        ABSENT = 'AUS', 'Ausente'
        LATE = 'TAR', 'Tardanza'
        EXCUSED = 'JUS', 'Justificado'

    session = models.ForeignKey(CourseSession, on_delete=models.CASCADE, related_name='attendance_records')
    participant = models.ForeignKey(CourseParticipant, on_delete=models.CASCADE, related_name='attendance_history')
    
    status = models.CharField(max_length=3, choices=Status.choices, default=Status.ABSENT)
    notes = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        unique_together = ('session', 'participant') # Solo una asistencia por persona por sesión

    def __str__(self): return f"{self.participant.person} - {self.session} : {self.get_status_display()}"