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
    
    # 🔧 REFACTOR: Instructor es ahora un campo directo del curso
    instructor = models.ForeignKey(
        Person,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses_taught',
        verbose_name="Instructor"
    )
    
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
    
    # 🆕 NEW: Grading Logic
    requires_approval_to_complete = models.BooleanField(
        default=False,
        verbose_name="Requiere Aprobación Manual",
        help_text="Si es True, el instructor debe asignar nota manualmente. Si es False, se completa automáticamente al terminar todas las lecciones."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.name
    
    @property
    def enrolled_count(self):
        # 🔧 REFACTOR: Ahora solo contamos estudiantes inscritos (todos los participants son estudiantes)
        return self.participants.filter(enrollment_status='ENR').count()

    @property
    def is_full(self):
        return self.enrolled_count >= self.max_participants


class CourseResource(models.Model):
    """Materiales de apoyo (PDFs, Videos, Links)."""
    
    class Type(models.TextChoices):
        FILE = 'FIL', 'Archivo (PDF/Doc/Img)'
        LINK = 'URL', 'Enlace Externo / Video'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources')
    # 🆕 NEW: Link resource to a specific lesson (optional, can be course-level)
    lesson = models.ForeignKey('CourseLesson', on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
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
    Necesario para tomar asistencia por día en cursos Presenciales/Híbridos.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    topic = models.CharField(max_length=200, verbose_name="Tema / Título de la Sesión")
    date = models.DateField(verbose_name="Fecha de la sesión")
    start_time = models.TimeField(verbose_name="Hora Inicio")
    end_time = models.TimeField(verbose_name="Hora Fin")
    
    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self): return f"{self.course.name} - {self.topic} ({self.date})"


# 🆕 NEW: Hierarchical Content Models
class CourseModule(models.Model):
    """
    Módulos del curso para organizar el contenido de forma jerárquica.
    Cada módulo contiene múltiples lecciones.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    name = models.CharField(max_length=200, verbose_name="Nombre del Módulo")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")
    
    class Meta:
        ordering = ['order']
        unique_together = ['course', 'order']
        verbose_name = "Módulo del Curso"
        verbose_name_plural = "Módulos del Curso"
    
    def __str__(self): return f"{self.course.name} - {self.name}"


class CourseLesson(models.Model):
    """
    Lecciones individuales dentro de un módulo.
    Contiene el contenido educativo real.
    """
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200, verbose_name="Título de la Lección")
    content = models.TextField(verbose_name="Contenido", help_text="Contenido en formato de texto enriquecido", blank=True, null=True)
    # 🔧 REFACTOR: Resources (files/urls) are now in CourseResource model linked to this lesson
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name="Duración (minutos)")
    
    class Meta:
        ordering = ['order']
        unique_together = ['module', 'order']
        verbose_name = "Lección"
        verbose_name_plural = "Lecciones"
    
    def __str__(self): return f"{self.module.name} - {self.title}"


class CourseParticipant(models.Model):
    """
    🔧 REFACTOR: CourseParticipant ahora solo almacena ESTUDIANTES.
    Los instructores se asignan directamente en Course.instructor.
    
    ⚠️ PENDING RENAME: Este modelo será renombrado a 'Enrollment' en una migración posterior.
    """
    
    class EnrollmentStatus(models.TextChoices):
        REQUESTED = 'REQ', 'Solicitud Enviada'
        ENROLLED = 'ENR', 'Inscrito'
        REJECTED = 'REJ', 'Solicitud Rechazada'

    class AcademicStatus(models.TextChoices):
        PENDING = 'PEN', 'En Curso'
        COMPLETED = 'COM', 'Completado'
        PASSED = 'APR', 'Aprobado'
        FAILED = 'REP', 'Reprobado'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='participants')
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='training_courses')
    
    # Campos de estado (solo para estudiantes)
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
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Solicitud")
    
    class Meta:
        unique_together = ('course', 'person')

    def __str__(self): return f"{self.person} en {self.course}"


# 🆕 NEW: Lesson Progress Tracking
class LessonProgress(models.Model):
    """
    Rastrea el progreso de cada estudiante en cada lección.
    Se usa para calcular el porcentaje de completitud y determinar si el curso está completo.
    """
    enrollment = models.ForeignKey(
        CourseParticipant,  # Will reference 'Enrollment' after rename
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(CourseLesson, on_delete=models.CASCADE, related_name='progress_records')
    completed = models.BooleanField(default=False, verbose_name="Completada")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Completitud")
    
    class Meta:
        unique_together = ['enrollment', 'lesson']
        verbose_name = "Progreso de Lección"
        verbose_name_plural = "Progreso de Lecciones"
    
    def __str__(self): 
        return f"{self.enrollment.person} - {self.lesson.title} ({'✓' if self.completed else '✗'})"


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