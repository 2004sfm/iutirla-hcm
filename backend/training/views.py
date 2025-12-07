from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Course, CourseResource, CourseSession, CourseParticipant, AttendanceRecord,
    CourseModule, CourseLesson, LessonProgress  # 🆕 NEW
)
from .serializers import (
    CourseSerializer, CourseResourceSerializer, CourseSessionSerializer, 
    CourseParticipantSerializer, AttendanceRecordSerializer, ParticipantListSerializer,
    CourseModuleSerializer, CourseLessonSerializer, LessonProgressSerializer  # 🆕 NEW
)
from django.db.models import Q
from .permissions import IsInstructorOrAdmin
from . import services  # 🆕 NEW: Import business logic services

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        queryset = Course.objects.all().order_by('-start_date')
        user = self.request.user
        
        # 1. Admin ve todo
        if user.is_staff:
            return queryset
            
        # 2. Empleados (Lógica Híbrida con Privacy)
        if hasattr(user, 'person'):
            person = user.person
            # Obtener el departamento del empleo activo (ACT, SUS, PER, REP)
            active_employment = person.employments.filter(
                current_status__in=['ACT', 'SUS', 'PER', 'REP']
            ).first()
            
            user_department = active_employment.position.department if active_employment and active_employment.position else None
            
            return queryset.filter(
                # CONDICIÓN A: Soy participante (Instructor o Estudiante)
                Q(participants__person=person) |
                
                # CONDICIÓN B: El curso está abierto y es público
                Q(
                    status__in=[Course.Status.SCHEDULED, Course.Status.IN_PROGRESS],
                    is_public=True
                ) |
                
                # CONDICIÓN C: El curso es privado pero soy del mismo departamento
                Q(
                    status__in=[Course.Status.SCHEDULED, Course.Status.IN_PROGRESS],
                    is_public=False,
                    department=user_department
                ) if user_department else Q(pk__in=[])  # Si no tiene department, no aplica
            ).distinct()
            
        return Course.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_enrollment(self, request, pk=None):
        """
        Permite a un estudiante solicitar inscripción en un curso.
        Crea un registro CourseParticipant con enrollment_status=REQUESTED.
        🔧 REFACTOR: Todos los participants son estudiantes ahora.
        """
        course = self.get_object()
        user = request.user

        if not hasattr(user, 'person'):
            return Response(
                {'error': 'Usuario sin perfil de persona asociado.'},
                status=400
            )

        # Verificar si ya existe una inscripción
        existing = CourseParticipant.objects.filter(
            course=course,
            person=user.person
        ).first()

        if existing:
            return Response(
                {'error': f'Ya tienes una solicitud/inscripción en este curso (Estado: {existing.get_enrollment_status_display()}).'},
                status=400
            )

        # Crear la solicitud
        participant = CourseParticipant.objects.create(
            course=course,
            person=user.person,
            enrollment_status=CourseParticipant.EnrollmentStatus.REQUESTED
        )

        serializer = CourseParticipantSerializer(participant)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def approve_enrollment(self, request, pk=None):
        """
        Permite a Admin o Instructor aprobar una solicitud de inscripción.
        Cambia enrollment_status de REQUESTED a ENROLLED.
        🔧 REFACTOR: Usa course.instructor en lugar de role.
        """
        course = self.get_object()
        user = request.user

        # Verificar permisos: Admin o Instructor del curso
        if not user.is_staff:
            # 🔧 REFACTOR: Verificar si es el instructor del curso
            if not (hasattr(user, 'person') and course.instructor == user.person):
                return Response(
                    {'error': 'No tienes permiso para aprobar inscripciones en este curso.'},
                    status=403
                )

        participant_id = request.data.get('participant_id')
        try:
            participant = CourseParticipant.objects.get(id=participant_id, course=course)
        except CourseParticipant.DoesNotExist:
            return Response({'error': 'Participante no encontrado.'}, status=404)

        if participant.enrollment_status != CourseParticipant.EnrollmentStatus.REQUESTED:
            return Response(
                {'error': 'Solo se pueden aprobar solicitudes con estado "Solicitud Enviada".'},
                status=400
            )

        participant.enrollment_status = CourseParticipant.EnrollmentStatus.ENROLLED
        participant.save()

        serializer = CourseParticipantSerializer(participant)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject_enrollment(self, request, pk=None):
        """
        Permite a Admin o Instructor rechazar una solicitud de inscripción.
        Cambia enrollment_status de REQUESTED a REJECTED.
        🔧 REFACTOR: Usa course.instructor en lugar de role.
        """
        course = self.get_object()
        user = request.user

        # Verificar permisos: Admin o Instructor del curso
        if not user.is_staff:
            # 🔧 REFACTOR: Verificar si es el instructor del curso
            if not (hasattr(user, 'person') and course.instructor == user.person):
                return Response(
                    {'error': 'No tienes permiso para rechazar inscripciones en este curso.'},
                    status=403
                )

        participant_id = request.data.get('participant_id')
        try:
            participant = CourseParticipant.objects.get(id=participant_id, course=course)
        except CourseParticipant.DoesNotExist:
            return Response({'error': 'Participante no encontrado.'}, status=404)

        if participant.enrollment_status != CourseParticipant.EnrollmentStatus.REQUESTED:
            return Response(
                {'error': 'Solo se pueden rechazar solicitudes con estado "Solicitud Enviada".'},
                status=400
            )

        participant.enrollment_status = CourseParticipant.EnrollmentStatus.REJECTED
        participant.save()

        serializer = CourseParticipantSerializer(participant)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_enrollment(self, request, pk=None):
        """
        Retorna el estado de inscripción del usuario actual en este curso.
        Si no existe inscripción, retorna 404.
        """
        course = self.get_object()
        user = request.user

        if not hasattr(user, 'person'):
            return Response({'error': 'Usuario sin perfil de persona asociado.'}, status=400)

        try:
            participant = CourseParticipant.objects.get(
                course=course,
                person=user.person
            )
            serializer = CourseParticipantSerializer(participant)
            return Response(serializer.data)
        except CourseParticipant.DoesNotExist:
            # 🔧 FIX: Si es el instructor, retornamos un estado especial 200 OK
            if course.instructor == user.person:
                return Response({
                    'id': 0, # Dummy ID
                    'enrollment_status': 'ENR', # Treat as enrolled
                    'is_instructor': True
                })
            
            return Response({'error': 'No hay inscripción para este usuario.'}, status=404)

class CourseResourceViewSet(viewsets.ModelViewSet):
    serializer_class = CourseResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        queryset = CourseResource.objects.all()
        user = self.request.user

        # Filtro de Seguridad
        if hasattr(user, 'person') and not user.is_staff:
            # SOLO si estoy INSCRITO (ENR) o soy INSTRUCTOR
            # 🔧 REFACTOR: Verificar instructor con course.instructor
            queryset = queryset.filter(
                Q(course__participants__person=user.person, course__participants__enrollment_status='ENR') | 
                Q(course__instructor=user.person)
            ).distinct()

        # 👇 FILTRO ESPECÍFICO (Crucial) 👇
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset

class CourseSessionViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        queryset = CourseSession.objects.all()
        user = self.request.user

        if user.is_staff:
            return queryset

        if hasattr(user, 'person'):
            # SOLO si estoy INSCRITO (ENR) o soy INSTRUCTOR
            # 🔧 REFACTOR: Verificar instructor con course.instructor
            return queryset.filter(
                Q(course__participants__person=user.person, course__participants__enrollment_status='ENR') |
                Q(course__instructor=user.person)
            ).distinct()
        
        # Agregamos el filtro por curso específico también aquí por seguridad
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return CourseSession.objects.none()

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        session = self.get_object()
        records = session.attendance_records.select_related('participant__person').all()
        serializer = AttendanceRecordSerializer(records, many=True)
        return Response(serializer.data)

class CourseParticipantViewSet(viewsets.ModelViewSet):
    queryset = CourseParticipant.objects.all()
    serializer_class = CourseParticipantSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_serializer_class(self):
        """Use ParticipantListSerializer for list/retrieve to include person_id_document"""
        if self.action in ['list', 'retrieve']:
            return ParticipantListSerializer
        return CourseParticipantSerializer

    def get_queryset(self):
        # OPTIMIZACIÓN: Cargar la persona junto con el participante
        queryset = CourseParticipant.objects.select_related('person')
        
        # Filtro por curso
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # 🔧 REFACTOR: Filtrado solo por enrollment_status (ya no hay role)
        enrollment_status = self.request.query_params.get('enrollment_status')
        
        if enrollment_status:
            queryset = queryset.filter(enrollment_status=enrollment_status)

        # Filtro por persona (Fix: para que el frontend pueda filtrar mis inscripciones)
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person_id=person_id)
            
        return queryset

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    # Usamos el permiso para evitar que alumnos editen (solo instructores/admin editan)
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        # Optimizamos para cargar Sesión y Persona de un solo golpe
        queryset = AttendanceRecord.objects.select_related(
            'session__course', 
            'participant__person'
        ).all()
        
        user = self.request.user

        # 1. Admin ve todo
        if user.is_staff:
            return queryset

        if hasattr(user, 'person'):
            # 2. Lógica Híbrida (Instructor vs Estudiante)
            # 🔧 REFACTOR: Verificar instructor con course.instructor
            return queryset.filter(
                # CASO A: Soy el INSTRUCTOR del curso al que pertenece la sesión
                Q(session__course__instructor=user.person) |
                
                # CASO B: El registro es MÍO (Soy el estudiante evaluado)
                Q(participant__person=user.person)
            ).distinct()

        return AttendanceRecord.objects.none()


# 🆕 NEW: HIERARCHICAL CONTENT VIEWSETS

class CourseModuleViewSet(viewsets.ModelViewSet):
    """ViewSet para módulos del curso."""
    serializer_class = CourseModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = CourseModule.objects.select_related('course').prefetch_related('lessons').all()
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset.order_by('order')
    
    def get_permissions(self):
        """Only instructors and admins can create/update/delete modules."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsInstructorOrAdmin()]
        return [permissions.IsAuthenticated()]


class CourseLessonViewSet(viewsets.ModelViewSet):
    """ViewSet para lecciones del curso."""
    serializer_class = CourseLessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = CourseLesson.objects.select_related('module__course').all()
        
        # Filter by module if provided
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(module__course_id=course_id)
        
        return queryset.order_by('module__order', 'order')
    
    def get_permissions(self):
        """Only instructors and admins can create/update/delete lessons."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsInstructorOrAdmin()]
        return [permissions.IsAuthenticated()]


class LessonProgressViewSet(viewsets.ModelViewSet):
    """ViewSet para el progreso de lecciones por estudiante."""
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination for simpler frontend handling

    def get_queryset(self):
        queryset = LessonProgress.objects.select_related(
            'enrollment__person', 
            'lesson__module__course'
        ).all()
        
        user = self.request.user
        
        # Admins see all
        if user.is_staff:
            return queryset
        
        if hasattr(user, 'person'):
            # Filter by enrollment (my progress)
            enrollment_id = self.request.query_params.get('enrollment')
            if enrollment_id:
                queryset = queryset.filter(enrollment_id=enrollment_id)
            
            # Filter by lesson
            lesson_id = self.request.query_params.get('lesson')
            if lesson_id:
                queryset = queryset.filter(lesson_id=lesson_id)
            
            # Students can only see their own progress
            # Instructors can see progress for their courses
            return queryset.filter(
                Q(enrollment__person=user.person) |  # My progress
                Q(lesson__module__course__instructor=user.person)  # I'm the instructor
            ).distinct()
        
        return LessonProgress.objects.none()
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_complete(self, request):
        """
        Mark a lesson as complete for the current user.
        Automatically checks if course is completed.
        """
        user = request.user
        
        if not hasattr(user, 'person'):
            return Response(
                {'error': 'Usuario sin perfil de persona asociado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lesson_id = request.data.get('lesson_id')
        
        if not lesson_id:
            return Response(
                {'error': 'lesson_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lesson = CourseLesson.objects.get(id=lesson_id)
        except CourseLesson.DoesNotExist:
            return Response(
                {'error': 'Lección no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get user's enrollment for this course
        try:
            enrollment = CourseParticipant.objects.get(
                person=user.person,
                course=lesson.module.course,
                enrollment_status=CourseParticipant.EnrollmentStatus.ENROLLED
            )
        except CourseParticipant.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en este curso'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use service to mark as complete and check completion
        result = services.mark_lesson_as_complete(enrollment.id, lesson_id)
        
        if 'error' in result:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize the lesson progress
        serializer = LessonProgressSerializer(result['lesson_progress'])
        
        return Response({
            'lesson_progress': serializer.data,
            'completion_status': result['completion_check']
        }, status=status.HTTP_200_OK)


# 🆕 NEW: ADDITIONAL ACTIONS FOR COURSE PARTICIPANT

# Add these as a mixin or directly to CourseParticipantViewSet
# For now, I'll add them as standalone actions that can be added to the viewset

class CourseParticipantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing course participants (students).
    🔧 REFACTOR: Now only manages students, not instructors.
    """
    serializer_class = CourseParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Use ParticipantListSerializer for list/retrieve to include person_id_document"""
        if self.action in ['list', 'retrieve']:
            return ParticipantListSerializer
        return CourseParticipantSerializer

    def get_queryset(self):
        # OPTIMIZACIÓN: Cargar la persona junto con el participante
        queryset = CourseParticipant.objects.select_related('person')
        
        # Filtro por curso
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # 🔧 REFACTOR: Filtrado solo por enrollment_status (ya no hay role)
        enrollment_status = self.request.query_params.get('enrollment_status')
        
        if enrollment_status:
            queryset = queryset.filter(enrollment_status=enrollment_status)

        # Filtro por persona (Fix: para que el frontend pueda filtrar mis inscripciones)
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person_id=person_id)
            
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsInstructorOrAdmin])
    def assign_grade(self, request, pk=None):
        """
        🆕 NEW: Assign final grade to a student and mark as completed.
        Only available for instructors and admins.
        """
        participant = self.get_object()
        user = request.user
        
        # Verify permissions: Admin or Instructor of the course
        if not user.is_staff:
            if not (hasattr(user, 'person') and participant.course.instructor == user.person):
                return Response(
                    {'error': 'No tienes permiso para asignar notas en este curso.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        grade = request.data.get('final_grade')
        
        if grade is None:
            return Response(
                {'error': 'final_grade es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            grade = float(grade)
            if grade < 0 or grade > 20:
                return Response(
                    {'error': 'La nota debe estar entre 0 y 20'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'final_grade debe ser un número válido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Assign grade and mark as completed
        participant.grade = grade
        participant.academic_status = CourseParticipant.AcademicStatus.COMPLETED
        participant.save()
        
        serializer = CourseParticipantSerializer(participant)
        return Response({
            'message': 'Nota asignada exitosamente',
            'participant': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_progress(self, request):
        """
        🆕 NEW: Get progress for the current user in a specific course.
        """
        user = request.user
        
        if not hasattr(user, 'person'):
            return Response(
                {'error': 'Usuario sin perfil de persona asociado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enrollment = CourseParticipant.objects.get(
                person=user.person,
                course_id=course_id
            )
        except CourseParticipant.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en este curso'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        progress = services.calculate_course_progress(enrollment.id)
        
        return Response({
            'enrollment_id': enrollment.id,
            'enrollment_status': enrollment.enrollment_status,
            'academic_status': enrollment.academic_status,
            'grade': enrollment.grade,
            **progress
        }, status=status.HTTP_200_OK)

    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsInstructorOrAdmin])
    def assign_grade(self, request, pk=None):
        """
        Assign final grade to a student and mark as completed.
        Only available for instructors and admins.
        """
        participant = self.get_object()
        user = request.user
        
        # Verify permissions: Admin or Instructor of the course
        if not user.is_staff:
            if not (hasattr(user, 'person') and participant.course.instructor == user.person):
                return Response(
                    {'error': 'No tienes permiso para asignar notas en este curso.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        grade = request.data.get('final_grade')
        
        if grade is None:
            return Response(
                {'error': 'final_grade es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            grade = float(grade)
            if grade < 0 or grade > 20:
                return Response(
                    {'error': 'La nota debe estar entre 0 y 20'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'final_grade debe ser un número válido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Assign grade and mark as completed
        participant.grade = grade
        participant.academic_status = CourseParticipant.AcademicStatus.COMPLETED
        participant.save()
        
        serializer = CourseParticipantSerializer(participant)
        return Response({
            'message': 'Nota asignada exitosamente',
            'participant': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_progress(self, request):
        """Get progress for the current user in a specific course."""
        user = request.user
        
        if not hasattr(user, 'person'):
            return Response(
                {'error': 'Usuario sin perfil de persona asociado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enrollment = CourseParticipant.objects.get(
                person=user.person,
                course_id=course_id
            )
        except CourseParticipant.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en este curso'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        progress = services.calculate_course_progress(enrollment.id)
        
        return Response({
            'enrollment_id': enrollment.id,
            'enrollment_status': enrollment.enrollment_status,
            'academic_status': enrollment.academic_status,
            'grade': enrollment.grade,
            **progress
        }, status=status.HTTP_200_OK)