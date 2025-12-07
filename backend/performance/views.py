from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Count, F
from .models import EvaluationPeriod, Competency, PerformanceReview, ReviewDetail
from .serializers import EvaluationPeriodSerializer, CompetencySerializer, PerformanceReviewSerializer, ReviewDetailSerializer
from employment.models import Employment

class EvaluationPeriodViewSet(viewsets.ModelViewSet):
    queryset = EvaluationPeriod.objects.all()
    serializer_class = EvaluationPeriodSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = None  # Devolver todos sin paginar

    @action(detail=True, methods=['post'])
    def generate_reviews(self, request, pk=None):
        """
        Genera masivamente las evaluaciones para todos los empleados activos.
        """
        period = self.get_object()
        count_created = 0
        
        # Estatus que representan vinculación activa
        ACTIVE_STATUSES = ['ACT', 'SUS', 'PER', 'REP']
        
        # 1. Buscar contratos activos (ocupan silla)
        active_employments = Employment.objects.filter(
            current_status__in=ACTIVE_STATUSES
        ).select_related('position__department', 'position__job_title', 'person')

        try:
            with transaction.atomic():
                for emp in active_employments:
                    # A. Determinar Jefe (Evaluador)
                    # manager_positions es ManyToMany, tomamos el primero
                    manager_positions = emp.position.manager_positions.all()
                    evaluator = None
                    
                    for boss_pos in manager_positions:
                        # Buscamos quién ocupa esa posición gerencial actualmente
                        boss = Employment.objects.filter(
                            position=boss_pos, 
                            current_status__in=ACTIVE_STATUSES
                        ).first()
                        if boss:
                            evaluator = boss.person
                            break  # Usamos el primer jefe encontrado
                    
                    # Si no tiene jefe asignado, no generamos.
                    if not evaluator:
                        continue 

                    # B. Crear Boleta
                    review, created = PerformanceReview.objects.get_or_create(
                        period=period,
                        employment=emp,
                        defaults={'evaluator': evaluator, 'status': 'BOR'}
                    )

                    if created:
                        count_created += 1
                        
                        # C. Asignar Competencias (Híbridas: Globales + Específicas del JobTitle)
                        comps = Competency.objects.filter(
                            Q(is_global=True) | 
                            Q(job_titles=emp.position.job_title)
                        ).distinct()
                        
                        details = [
                            ReviewDetail(review=review, competency=c, score=0)
                            for c in comps
                        ]
                        ReviewDetail.objects.bulk_create(details)

            return Response({"message": f"Proceso finalizado. Se generaron {count_created} evaluaciones nuevas."}, status=200)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CompetencyViewSet(viewsets.ModelViewSet):
    queryset = Competency.objects.all().order_by('category', 'name')
    serializer_class = CompetencySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    search_fields = ['name', 'description']
    filterset_fields = ['category', 'is_global']
    
    def filter_queryset(self, queryset):
        """Salta los filtros por defecto cuando se busca por categoría"""
        search_field = self.request.query_params.get('search_field', '')
        if search_field == 'category':
            # Ya filtrado en get_queryset, saltar SearchFilter
            return queryset
        return super().filter_queryset(queryset)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro personalizado por nombre de categoría
        search = self.request.query_params.get('search', '')
        search_field = self.request.query_params.get('search_field', '')
        
        if search and search_field == 'category':
            # Mapeo de nombres a códigos
            category_map = {
                'calidad': 'CAL',
                'compromiso': 'COM', 
                'comunicación': 'CMU',
                'comunicacion': 'CMU',
                'organización': 'ORG',
                'organizacion': 'ORG',
                'disciplina': 'DIS',
                'proactividad': 'PRO',
            }
            
            search_lower = search.lower()
            # Buscar categorías que coincidan parcialmente
            matching_codes = [
                code for name, code in category_map.items()
                if search_lower in name
            ]
            
            if matching_codes:
                queryset = queryset.filter(category__in=matching_codes)
            else:
                queryset = queryset.none()  # No hay coincidencias
        
        return queryset


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = PerformanceReview.objects.all()

        # 1. FILTRO DE SEGURIDAD BASE (Quién puede ver qué en general)
        if not user.is_staff:
            if hasattr(user, 'person'):
                queryset = queryset.filter(
                    Q(evaluator=user.person) |          # Soy el Jefe
                    Q(employment__person=user.person)   # Soy el Empleado
                )
            else:
                return PerformanceReview.objects.none()

        # 2. FILTRO DE ALCANCE (NUEVO - CRÍTICO PARA TU PROBLEMA)
        scope = self.request.query_params.get('scope')
        
        if scope == 'received':
            # CASO: "Mis Evaluaciones" (Soy el empleado)
            if hasattr(user, 'person'):
                queryset = queryset.filter(employment__person=user.person)
            else:
                return PerformanceReview.objects.none() # Admin sin persona no tiene evaluaciones propias
                
        elif scope == 'given':
            # CASO: "Mi Equipo" (Soy el jefe)
            if hasattr(user, 'person'):
                queryset = queryset.filter(evaluator=user.person)
        
        # 3. FILTRO POR DEPARTAMENTO (Existente)
        dept_id = self.request.query_params.get('department')
        if dept_id:
            if dept_id == '0':
                queryset = queryset.filter(employment__position__department__isnull=True)
            else:
                queryset = queryset.filter(employment__position__department_id=dept_id)

        return queryset.distinct()

    @action(detail=False, methods=['get'])
    def my_teams_summary(self, request):
        """
        Devuelve el resumen de equipos que el usuario supervisa, 
        basado en la JERARQUÍA y su ROL FUNCIONAL.
        """
        user = request.user
        
        if not hasattr(user, 'person'):
            return Response([])

        # Definimos los roles funcionales que otorgan permiso de supervisión
        # 🚨 IMPORTANTE: Estos nombres deben coincidir exactamente con los que has creado en la tabla 'Role'
        SUPERVISORY_ROLES = ['Manager', 'Supervisor', 'Gerente', 'Director'] 

        # 1. Identificar todas las POSICIONES activas que ocupa este usuario Y que tienen rol de JEFE
        user_manager_positions = Employment.objects.filter(
            person=user.person,
            current_status__is_active_relationship=True,
            # CRÍTICO: Filtramos por el nombre del rol (Employment.role.name)
            role__name__in=SUPERVISORY_ROLES 
        ).values_list('position_id', flat=True)

        
        # 2. Si el usuario no tiene ninguna posición activa de Manager, no ve equipos.
        # (Excepción: El Admin puede ver todo)
        if not user_manager_positions.exists() and not user.is_staff:
            return Response([])
        
        # 3. Definir el QuerySet Base
        if user.is_staff:
            # Si es admin, ve todas las evaluaciones generadas para monitoreo
            base_qs = PerformanceReview.objects.all()
        else:
            # Si es Gerente/Supervisor, solo ve las evaluaciones de subordinados que reportan a SUS posiciones
            # La evaluación del subordinado debe reportar a una de las sillas que yo ocupo
            base_qs = PerformanceReview.objects.filter(
                employment__position__manager_position__in=user_manager_positions,
                evaluator=user.person # Filtro de seguridad adicional: solo si me asignaron como evaluador
            )
        
        # 4. Agrupar y contar (El proceso de agrupamiento sigue igual)
        teams = base_qs.values(
            dept_id=F('employment__position__department__id'),
            dept_name=F('employment__position__department__name')
        ).annotate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='BOR'))
        ).order_by('dept_name')

        return Response(list(teams))

class ReviewDetailViewSet(viewsets.ModelViewSet):
    queryset = ReviewDetail.objects.all()
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        # Recalcular promedio del padre al guardar un detalle
        self.get_object().review.calculate_score()
        return response