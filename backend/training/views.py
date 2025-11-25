from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, CourseResource, CourseSession, CourseParticipant, AttendanceRecord
from .serializers import (
    CourseSerializer, CourseResourceSerializer, CourseSessionSerializer, 
    CourseParticipantSerializer, AttendanceRecordSerializer
)
from django.db.models import Q
from .permissions import IsInstructorOrAdmin # <--- Importar

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin] # Tu permiso custom

    def get_queryset(self):
        queryset = Course.objects.all().order_by('-start_date')
        user = self.request.user
        
        # 1. Admin ve todo
        if user.is_staff:
            return queryset
            
        # 2. Empleados (Lógica Híbrida)
        if hasattr(user, 'person'):
            return queryset.filter(
                # CONDICIÓN A: Soy participante (Instructor o Estudiante)
                Q(participants__person=user.person) |
                
                # CONDICIÓN B: El curso está abierto al público (Catálogo)
                Q(status__in=[Course.Status.SCHEDULED, Course.Status.IN_PROGRESS])
            ).distinct()
            
        return Course.objects.none()

class CourseResourceViewSet(viewsets.ModelViewSet):
    serializer_class = CourseResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        queryset = CourseResource.objects.all()
        user = self.request.user

        # Filtro de Seguridad
        if hasattr(user, 'person') and not user.is_staff:
            queryset = queryset.filter(course__participants__person=user.person).distinct()

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
            return queryset.filter(course__participants__person=user.person).distinct()
        
        # Agregamos el filtro por curso específico también aquí por seguridad
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return CourseSession.objects.none()

    # 👇👇👇 AGREGA ESTE BLOQUE QUE ES EL QUE FALTA 👇👇👇
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        session = self.get_object()
        records = session.attendance_records.select_related('participant__person').all()
        serializer = AttendanceRecordSerializer(records, many=True)
        return Response(serializer.data)

# training/views.py

class CourseParticipantViewSet(viewsets.ModelViewSet):
    queryset = CourseParticipant.objects.all()
    serializer_class = CourseParticipantSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get_queryset(self):
        # OPTIMIZACIÓN: Cargar la persona junto con el participante
        queryset = CourseParticipant.objects.select_related('person')
        
        # Filtro por curso (Ya lo tenías, pero lo repasamos)
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