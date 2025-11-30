from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import JobPosting, Candidate, CandidateLog
from .serializers import (
    JobPostingListSerializer,
    JobPostingDetailSerializer,
    JobPostingAdminSerializer,
    CandidateCreateSerializer,
    CandidateListSerializer,
    CandidateDetailSerializer,
    CandidateStageUpdateSerializer,
    HireCandidateSerializer,
    CandidateLogSerializer
)
from .services import hire_candidate, move_finalists_to_pool
from .utils import send_status_change_email


# --- ViewSets Públicos (Sin Autenticación) ---

class PublicJobPostingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet público para listar vacantes activas.
    Solo muestra vacantes publicadas y no cerradas.
    """
    permission_classes = [AllowAny]
    serializer_class = JobPostingListSerializer
    
    def get_queryset(self):
        """Filtrar solo vacantes publicadas y activas"""
        today = timezone.now().date()
        return JobPosting.objects.filter(
            status='PUBLISHED',
            published_date__lte=today
        ).filter(
            Q(closing_date__gte=today) | Q(closing_date__isnull=True)
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Devolver detalle completo de una vacante"""
        instance = self.get_object()
        serializer = JobPostingDetailSerializer(instance)
        return Response(serializer.data)


class PublicCandidateApplicationViewSet(viewsets.GenericViewSet):
    """
    ViewSet público para postulaciones.
    Solo permite crear (POST) candidatos.
    """
    permission_classes = [AllowAny]
    serializer_class = CandidateCreateSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear una postulación (candidato)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Validar que la vacante esté publicada
        job_posting = serializer.validated_data.get('job_posting')
        if job_posting.status != 'PUBLISHED':
            return Response(
                {'error': 'Esta vacante no está disponible para postulaciones.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        candidate = serializer.save()
        
        return Response(
            {
                'message': '¡Postulación enviada exitosamente!',
                'candidate_id': candidate.id
            },
            status=status.HTTP_201_CREATED
        )


# --- ViewSets Administrativos (Con Autenticación) ---

class JobPostingViewSet(viewsets.ModelViewSet):
    """
    ViewSet administrativo para gestionar vacantes.
    CRUD completo de vacantes.
    """
    permission_classes = [IsAuthenticated]
    queryset = JobPosting.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobPostingListSerializer
        elif self.action == 'retrieve':
            return JobPostingDetailSerializer
        return JobPostingAdminSerializer
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publicar una vacante"""
        job_posting = self.get_object()
        
        # Preparar datos con el nuevo estado
        data = {
            'status': 'PUBLISHED',
            'position': job_posting.position.id if job_posting.position else None,
            'title': job_posting.title,
            'description': job_posting.description,
        }
        
        if not job_posting.published_date:
            data['published_date'] = timezone.now().date()
        
        # Validar usando el serializador (esto ejecutará validate())
        serializer = JobPostingAdminSerializer(job_posting, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Cerrar una vacante"""
        job_posting = self.get_object()
        job_posting.status = 'CLOSED'
        
        # Si no tiene fecha de cierre, registrar la fecha actual
        if not job_posting.closing_date:
            job_posting.closing_date = timezone.now().date()
        
        job_posting.save()
        
        serializer = self.get_serializer(job_posting)
        return Response(serializer.data)


class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet administrativo para gestionar candidatos.
    Incluye acciones especiales para contratar y cambiar etapa.
    """
    permission_classes = [IsAuthenticated]
    permission_classes = [IsAuthenticated]
    queryset = Candidate.objects.select_related('job_posting').prefetch_related('education')
    
    def log_action(self, candidate, action, details=None):
        """Registrar una acción en el historial"""
        user = self.request.user if self.request and hasattr(self.request, 'user') and self.request.user.is_authenticated else None
        CandidateLog.objects.create(
            candidate=candidate,
            user=user,
            action=action,
            details=details
        )

    def perform_update(self, serializer):
        super().perform_update(serializer)
        self.log_action(serializer.instance, 'UPDATE', "Actualización de datos del candidato")

    def get_serializer_class(self):
        if self.action == 'list':
            return CandidateListSerializer
        return CandidateDetailSerializer
    
    def get_queryset(self):
        """Filtrar por parámetros de query"""
        queryset = super().get_queryset()
        
        # Filtrar por vacante
        job_posting_id = self.request.query_params.get('job_posting')
        if job_posting_id:
            queryset = queryset.filter(job_posting_id=job_posting_id)
        
        # Filtrar por etapa
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage=stage)
        
        return queryset
    
    @action(detail=True, methods=['post'], url_path='change-stage')
    def change_stage(self, request, pk=None):
        """Cambiar la etapa de un candidato"""
        candidate = self.get_object()
        serializer = CandidateStageUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_stage = serializer.validated_data['stage']
        notes = serializer.validated_data.get('notes', '')
        
        # Actualizar
        candidate.stage = new_stage
        if notes:
            candidate.notes = (candidate.notes or '') + f"\n[{new_stage}] {notes}"
        candidate.save()
        


        
        # Verificar que el cambio se guardó correctamente
        candidate.refresh_from_db()
        if candidate.stage == new_stage:
            # Enviar notificación por correo
            send_status_change_email(candidate, new_stage)
        
        # Registrar en historial
        self.log_action(candidate, 'STAGE_CHANGE', f"Cambio a etapa {new_stage}. Notas: {notes}")
        
        return Response(
            CandidateDetailSerializer(candidate, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'])
    def hire(self, request, pk=None):
        """
        Contratar un candidato.
        Ejecuta la transacción completa de contratación.
        """
        candidate = self.get_object()
        
        # Validar que el candidato esté en una etapa válida para contratar
        if candidate.stage not in ['OFF', 'INT']:
            return Response(
                {'error': 'El candidato debe estar en etapa de Oferta o Entrevista para ser contratado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = HireCandidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = hire_candidate(candidate, serializer.validated_data)
            
            # Enviar notificación por correo (HIR = Hired)
            # Verificar primero
            candidate.refresh_from_db()
            if candidate.stage == 'HIRED':
                send_status_change_email(candidate, 'HIRED')
            
            # Registrar en historial
            self.log_action(candidate, 'HIRED', "Candidato contratado exitosamente")
            
            response_data = {
                'message': 'Candidato contratado exitosamente',
                'person_id': result['person'].id,
                'employment_id': result['employment'].id,
                'remaining_vacancies': result['remaining_vacancies'],
                'other_finalists': []
            }
            
            # Si hay otros finalistas, incluir información
            if result['other_finalists']:
                response_data['other_finalists'] = [
                    {
                        'id': c.id,
                        'name': f"{c.first_name} {c.last_name}",
                        'stage': c.get_stage_display()
                    }
                    for c in result['other_finalists']
                ]
                response_data['message'] += f". Hay {len(result['other_finalists'])} finalista(s) adicional(es)."
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def move_to_pool(self, request):
        """Mover candidatos al banco de elegibles"""
        candidate_ids = request.data.get('candidate_ids', [])
        
        if not candidate_ids:
            return Response(
                {'error': 'Debe proporcionar una lista de candidate_ids'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = move_finalists_to_pool(candidate_ids)
        
        return Response({
            'message': f'{updated_count} candidato(s) movido(s) al Banco de Elegibles',
            'updated_count': updated_count
        })

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Obtener historial de cambios del candidato"""
        candidate = self.get_object()
        logs = candidate.logs.all()
        serializer = CandidateLogSerializer(logs, many=True)
        return Response(serializer.data)
