from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, CourseResource, CourseSession, CourseParticipant, AttendanceRecord
from .serializers import (
    CourseSerializer, CourseResourceSerializer, CourseSessionSerializer, 
    CourseParticipantSerializer, AttendanceRecordSerializer
)
from django.db.models import Q
from .permissions import IsInstructorOrAdmin

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

    @action(detail=True, methods=['post'])
    def request_enrollment(self, request, pk=None):
        """
        Permite a un estudiante solicitar inscripción en un curso.
        Crea un registro CourseParticipant con enrollment_status=REQUESTED.
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
            role=CourseParticipant.Role.STUDENT,
            enrollment_status=CourseParticipant.EnrollmentStatus.REQUESTED
        )

        serializer = CourseParticipantSerializer(participant)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'], url_path='approve-enrollment/(?P<participant_id>[^/.]+)')
    def approve_enrollment(self, request, pk=None, participant_id=None):
        """
        Permite a Admin o Instructor aprobar una solicitud de inscripción.
        Cambia enrollment_status de REQUESTED a ENROLLED.
        """
        course = self.get_object()
        user = request.user

        # Verificar permisos: Admin o Instructor del curso
        if not user.is_staff:
            is_instructor = course.participants.filter(
                person=user.person,
                role=CourseParticipant.Role.INSTRUCTOR
            ).exists()
            if not is_instructor:
                return Response(
                    {'error': 'No tienes permiso para aprobar inscripciones en este curso.'},
                    status=403
                )

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

    @action(detail=True, methods=['post'], url_path='reject-enrollment/(?P<participant_id>[^/.]+)')
    def reject_enrollment(self, request, pk=None, participant_id=None):
        """
        Permite a Admin o Instructor rechazar una solicitud de inscripción.
        Cambia enrollment_status de REQUESTED a REJECTED.
        """
        course = self.get_object()
        user = request.user

        # Verificar permisos: Admin o Instructor del curso
        if not user.is_staff:
            is_instructor = course.participants.filter(
                person=user.person,
                role=CourseParticipant.Role.INSTRUCTOR
            ).exists()
            if not is_instructor:
                return Response(
                    {'error': 'No tienes permiso para rechazar inscripciones en este curso.'},
                    status=403
                )

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

    @action(detail=True, methods=['get'])
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
            return Response({'error': 'No hay inscripción para este usuario.'}, status=404)

class CourseResourceViewSet(viewsets.ModelViewSet):
    serializer_class = CourseResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        queryset = CourseResource.objects.all()
        user = self.request.user

        # Filtro de Seguridad
        if hasattr(user, 'person') and not user.is_staff:
            # SOLO si estoy INSCRITO (ENR) o soy INSTRUCTOR (INS)
            queryset = queryset.filter(
                Q(course__participants__person=user.person) &
                (
                    Q(course__participants__enrollment_status='ENR') | 
                    Q(course__participants__role='INS')
                )
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
            # SOLO si estoy INSCRITO (ENR) o soy INSTRUCTOR (INS)
            return queryset.filter(
                Q(course__participants__person=user.person) &
                (
                    Q(course__participants__enrollment_status='ENR') | 
                    Q(course__participants__role='INS')
                )
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

    def get_queryset(self):
        # OPTIMIZACIÓN: Cargar la persona junto con el participante
        queryset = CourseParticipant.objects.select_related('person')
        
        # Filtro por curso
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
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
            return queryset.filter(
                # CASO A: Soy el INSTRUCTOR del curso al que pertenece la sesión
                Q(session__course__participants__person=user.person, 
                  session__course__participants__role='INS') |
                
                # CASO B: El registro es MÍO (Soy el estudiante evaluado)
                Q(participant__person=user.person)
            ).distinct()

        return AttendanceRecord.objects.none()