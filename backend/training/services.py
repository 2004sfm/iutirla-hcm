"""
Business logic services for the Training module.
Contains reusable business logic separated from views and serializers.
"""

from django.utils import timezone
from django.db.models import Count, Q
from .models import Course, CourseParticipant, CourseModule, CourseLesson, LessonProgress


def calculate_course_progress(enrollment_id):
    """
    Calcula el porcentaje de progreso de un estudiante en un curso.
    
    Args:
        enrollment_id: ID del CourseParticipant (enrollment)
    
    Returns:
        dict: {
            'total_lessons': int,
            'completed_lessons': int,
            'progress_percentage': float,
            'is_complete': bool
        }
    """
    try:
        enrollment = CourseParticipant.objects.get(id=enrollment_id)
    except CourseParticipant.DoesNotExist:
        return {
            'total_lessons': 0,
            'completed_lessons': 0,
            'progress_percentage': 0.0,
            'is_complete': False,
            'error': 'Enrollment not found'
        }
    
    course = enrollment.course
    
    # Contar lecciones totales en el curso
    total_lessons = CourseLesson.objects.filter(
        module__course=course
    ).count()
    
    if total_lessons == 0:
        return {
            'total_lessons': 0,
            'completed_lessons': 0,
            'progress_percentage': 0.0,
            'is_complete': False
        }
    
    # Contar lecciones completadas por el estudiante
    completed_lessons = LessonProgress.objects.filter(
        enrollment=enrollment,
        completed=True
    ).count()
    
    progress_percentage = (completed_lessons / total_lessons) * 100
    is_complete = progress_percentage == 100
    
    return {
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'progress_percentage': round(progress_percentage, 2),
        'is_complete': is_complete
    }


def check_course_completion(enrollment_id):
    """
    Verifica si un estudiante ha completado el curso y actualiza su estado según las reglas:
    
    - Si completa 100% de lecciones + requires_approval_to_complete=False:
      → Auto-completa (academic_status = COMPLETED)
    
    - Si completa 100% de lecciones + requires_approval_to_complete=True:
      → NO auto-completa; el instructor debe asignar nota manualmente
    
    Args:
        enrollment_id: ID del CourseParticipant (enrollment)
    
    Returns:
        dict: {
            'status': str ('auto_completed', 'pending_grading', 'in_progress'),
            'message': str,
            'progress': dict (from calculate_course_progress)
        }
    """
    try:
        enrollment = CourseParticipant.objects.get(id=enrollment_id)
    except CourseParticipant.DoesNotExist:
        return {
            'status': 'error',
            'message': 'Enrollment not found',
            'progress': None
        }
    
    course = enrollment.course
    progress = calculate_course_progress(enrollment_id)
    
    # Si no hay lecciones, no podemos completar
    if progress['total_lessons'] == 0:
        return {
            'status': 'no_content',
            'message': 'El curso no tiene lecciones aún',
            'progress': progress
        }
    
    # Si NO ha completado el 100%, seguimos en progreso
    if not progress['is_complete']:
        return {
            'status': 'in_progress',
            'message': f"Progreso: {progress['progress_percentage']}%",
            'progress': progress
        }
    
    # Si YA completó el 100%:
    # Escenario A: Auto-completar (no requiere aprobación manual)
    if not course.requires_approval_to_complete:
        # Solo auto-completar si aún no está completado
        if enrollment.academic_status != CourseParticipant.AcademicStatus.COMPLETED:
            enrollment.academic_status = CourseParticipant.AcademicStatus.COMPLETED
            enrollment.save()
            
            return {
                'status': 'auto_completed',
                'message': 'Curso completado automáticamente al finalizar todas las lecciones',
                'progress': progress
            }
        else:
            return {
                'status': 'already_completed',
                'message': 'El curso ya estaba completado',
                'progress': progress
            }
    
    # Escenario B: Requiere calificación manual del instructor
    return {
        'status': 'pending_grading',
        'message': 'Has completado todas las lecciones. Pendiente de evaluación por el instructor.',
        'progress': progress
    }


def mark_lesson_as_complete(enrollment_id, lesson_id):
    """
    Marca una lección como completada para un estudiante y verifica si se completó el curso.
    
    Args:
        enrollment_id: ID del CourseParticipant (enrollment)
        lesson_id: ID del CourseLesson
    
    Returns:
        dict: {
            'lesson_progress': LessonProgress object,
            'completion_check': dict (from check_course_completion)
        }
    """
    try:
        enrollment = CourseParticipant.objects.get(id=enrollment_id)
        lesson = CourseLesson.objects.get(id=lesson_id)
    except (CourseParticipant.DoesNotExist, CourseLesson.DoesNotExist) as e:
        return {
            'error': str(e),
            'lesson_progress': None,
            'completion_check': None
        }
    
    # Crear o actualizar el progreso de la lección
    lesson_progress, created = LessonProgress.objects.get_or_create(
        enrollment=enrollment,
        lesson=lesson,
        defaults={'completed': True, 'completed_at': timezone.now()}
    )
    
    if not created and not lesson_progress.completed:
        # Si ya existía pero no estaba completada, la marcamos como completada
        lesson_progress.completed = True
        lesson_progress.completed_at = timezone.now()
        lesson_progress.save()
    
    # Verificar si el curso se completó
    completion_check = check_course_completion(enrollment_id)
    
    return {
        'lesson_progress': lesson_progress,
        'completion_check': completion_check
    }
