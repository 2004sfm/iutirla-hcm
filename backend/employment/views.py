from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Count
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Employment, EmploymentStatusLog, EmploymentDepartmentRole, PersonDepartmentRole,
    is_active_status, EmploymentStatusChoices
)
from .serializers import (
    EmploymentSerializer, EmployeeListSerializer, EmploymentStatusLogSerializer,
    EmploymentDepartmentRoleSerializer, PersonDepartmentRoleSerializer,
    EmployeePositionDataSerializer # Nuevo serializer
)
from core.filters import UnaccentSearchFilter

class EmploymentViewSet(viewsets.ModelViewSet):
    queryset = Employment.objects.all()
    serializer_class = EmploymentSerializer
    permission_classes = [permissions.IsAuthenticated] # Cambiado a IsAuthenticated para que my_org_chart funcione para empleados normales

    def get_queryset(self):
        """
        Optimización vital para cargar relaciones en una sola consulta.
        """
        queryset = self.queryset
        
        # Si es listado o detalle, optimizamos
        if self.action in ['list', 'retrieve', 'update', 'partial_update']:
            queryset = queryset.select_related(
                'person', 
                'position', 
                'position__department',
                'person__user_account' # Para saber si tiene usuario
            )
        
        # Si NO es admin, solo debería ver su propio contrato (excepto en my_org_chart que tiene su lógica propia)
        # Pero como el frontend de Admin Panel usa este endpoint para listar todo,
        # mantenemos el acceso total para staff, y restringido para otros si fuera necesario.
        # Por ahora, asumimos que el panel de /admin/personnel solo lo ven admins.
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'list': 
            return EmployeeListSerializer
        return EmploymentSerializer

    # --- ACCIÓN 1: TERMINAR CONTRATO ---
    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        # Solo admins pueden terminar contratos
        if not request.user.is_staff:
            return Response({"error": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)

        employment = self.get_object()
        
        end_date = request.data.get('end_date')
        exit_reason = request.data.get('exit_reason')
        exit_notes = request.data.get('exit_notes')
        deactivate_user = request.data.get('deactivate_user', True)

        if not end_date or not exit_reason:
            return Response({"error": "Fecha y motivo obligatorios."}, status=400)

        try:
            with transaction.atomic():
                # Buscar estatus de cierre - ahora es un valor de Choice
                # Usamos 'FIN' que corresponde a 'Finalizado' en EmploymentStatusChoices
                closed_status = EmploymentStatusChoices.TERMINATED

                # Actualizar
                employment.end_date = end_date
                employment.current_status = closed_status 
                employment.exit_reason = exit_reason
                employment.exit_notes = exit_notes
                employment.save() 

                # Desactivar usuario
                if deactivate_user and hasattr(employment.person, 'user_account') and employment.person.user_account:
                    user = employment.person.user_account
                    user.is_active = False
                    user.save()

            return Response(self.get_serializer(employment).data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    # --- ACCIÓN 2: DASHBOARD (KPIs) ---
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        # Solo admins ven el dashboard global
        if not request.user.is_staff:
            return Response({"error": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        
        # Filtrar empleados activos usando helper function
        all_employments = Employment.objects.all()
        active_qs = [e for e in all_employments if is_active_status(e.current_status)]

        # KPIs
        total_active = len(active_qs)
        new_hires = len([e for e in active_qs if e.hire_date >= start_of_month])
        
        # Exits
        inactive_qs = [e for e in all_employments if not is_active_status(e.current_status)]
        exits = len([e for e in inactive_qs if e.end_date and e.end_date >= start_of_month])
        
        pending_users = len([e for e in active_qs if not hasattr(e.person, 'user_account') or not e.person.user_account])

        # Deptos (usando queryset normal porque necesitamos aggregation)
        active_ids = [e.id for e in active_qs]
        dept_stats = Employment.objects.filter(id__in=active_ids).values('position__department__name') \
            .annotate(count=Count('id')).order_by('-count')[:5]

        # Vencimientos (con cédula)
        next_month = today + timedelta(days=30)
        expiring_list = []
        for emp in active_qs:
            if emp.end_date and today <= emp.end_date <= next_month:
                doc = emp.person.national_ids.filter(is_primary=True).first()
                doc_str = f"{doc.document_type}-{doc.number}" if doc else "S/D"
                
                expiring_list.append({
                    "id": emp.id,
                    "person_name": f"{emp.person.first_name} {emp.person.paternal_surname}",
                    "person_document": doc_str,
                    "end_date": emp.end_date
                })

        return Response({
            "headcount": total_active,
            "new_hires": new_hires,
            "exits": exits,
            "pending_users": pending_users,
            "department_distribution": list(dept_stats),
            "expiring_soon": expiring_list
        })

    # --- ACCIÓN 3: MI ORGANIGRAMA (Para el empleado) ---
    @action(detail=False, methods=['get'])
    def my_org_chart(self, request):
        """
        Devuelve jefe, compañeros y subordinados del usuario logueado.
        """
        user = request.user
        if not hasattr(user, 'person'):
            return Response({"error": "Sin perfil de empleado"}, status=404)

        # Mi empleo activo
        my_jobs = Employment.objects.filter(
            person=user.person
        ).select_related('position__department', 'position__manager_position')
        
        my_job = None
        for job in my_jobs:
            if is_active_status(job.current_status):
                my_job = job
                break

        if not my_job:
            return Response({"error": "No tienes contrato activo."}, status=404)

        data = {
            "me": {
                "name": str(user.person),
                "position": my_job.position.name,
                "department": my_job.position.department.name if my_job.position.department else "Sin Depto",
                "photo": user.person.photo.url if user.person.photo else None
            },
            "boss": None,
            "peers": [],
            "subordinates": []
        }

        # Jefe
        boss_pos = my_job.position.manager_position
        if boss_pos:
            boss_employments = Employment.objects.filter(
                position=boss_pos
            ).select_related('person')
            
            boss_employment = None
            for emp in boss_employments:
                if is_active_status(emp.current_status):
                    boss_employment = emp
                    break
            
            if boss_employment:
                data["boss"] = {
                    "name": str(boss_employment.person),
                    "position": boss_pos.name,
                    "photo": boss_employment.person.photo.url if boss_employment.person.photo else None
                }
            else:
                 data["boss"] = {"name": "VACANTE", "position": boss_pos.name, "photo": None}

        # Compañeros (Mismo Depto)
        if my_job.position.department:
            all_peers = Employment.objects.filter(
                position__department=my_job.position.department
            ).exclude(id=my_job.id).select_related('person', 'position')[:20]  # Traemos más para filtrar

            peers = [p for p in all_peers if is_active_status(p.current_status)][:10]

            data["peers"] = [{
                "name": str(p.person),
                "position": p.position.name,
                "photo": p.person.photo.url if p.person.photo else None
            } for p in peers]

        # Subordinados (Si soy jefe)
        all_subordinates = Employment.objects.filter(
            position__manager_position=my_job.position
        ).select_related('person', 'position')

        subordinates = [s for s in all_subordinates if is_active_status(s.current_status)]

        data["subordinates"] = [{
            "name": str(s.person),
            "position": s.position.name,
            "photo": s.person.photo.url if s.person.photo else None
        } for s in subordinates]

        return Response(data)
    
    @action(detail=False, methods=['get'])
    def my_departments(self, request):
        user = request.user
        if not hasattr(user, 'person'):
            return Response([])

        my_employments = Employment.objects.filter(
            person=user.person
        ).select_related('position', 'position__department', 'position__job_title')
        
        # Filtrar solo activos
        active_employments = [e for e in my_employments if is_active_status(e.current_status)]

        departments_map = {}

        for emp in active_employments:
            dept = emp.position.department
            dept_id = dept.id if dept else 0
            dept_name = dept.name if dept else "Sin Departamento Asignado"
            dept_desc = getattr(dept, 'description', 'Área general.') if dept else "Posición fuera de estructura."

            # Determinamos el nombre del cargo de forma segura
            pos_name = emp.position.name
            
            # Si pos_name es None, intentamos usar el Job Title o un fallback
            if not pos_name:
                if emp.position.job_title:
                    pos_name = emp.position.job_title.name
                else:
                    pos_name = "Cargo Sin Nombre"

            if dept_id in departments_map:
                if pos_name not in departments_map[dept_id]['positions_list']:
                    departments_map[dept_id]['positions_list'].append(pos_name)
            else:
                departments_map[dept_id] = {
                    "dept_id": dept_id,
                    "dept_name": dept_name,
                    "dept_description": dept_desc,
                    "start_date": emp.hire_date,
                    "positions_list": [pos_name] 
                }

        final_data = []
        for item in departments_map.values():
            # Ahora positions_list garantiza tener solo strings
            item['my_position'] = " / ".join(item['positions_list'])
            del item['positions_list']
            final_data.append(item)

        return Response(final_data)

    # --- ACCIÓN 4: DATOS DEL PUESTO (MY POSITION DATA) ---
    @action(detail=False, methods=['get'])
    def my_position_data(self, request):
        """
        Retorna los empleos activos del usuario con detalle de posición (Objetivo, Funciones).
        Usado en la página "Datos del Puesto".
        """
        user = request.user
        if not hasattr(user, 'person'):
            return Response([])

        # Buscar empleos activos asociados a la persona
        my_employments = Employment.objects.filter(
            person=user.person
        ).select_related(
            'position', 
            'position__department', 
            'position__job_title'
        ).prefetch_related(
            'position__functions',  # Para el serializer
            'position__manager_positions'  # Para supervisor info (ManyToMany)
        )
        
        # Filtrar solo activos usando helper
        active_employments = [e for e in my_employments if is_active_status(e.current_status)]
        
        serializer = EmployeePositionDataSerializer(active_employments, many=True, context={'request': request})
        return Response(serializer.data)


# Viewset para logs
class EmploymentStatusLogViewSet(viewsets.ModelViewSet):
    queryset = EmploymentStatusLog.objects.all()
    serializer_class = EmploymentStatusLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


# --- VIEWSET PARA ROLES JERÁRQUICOS EN DEPARTAMENTO ---

class EmploymentDepartmentRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los roles jerárquicos de empleados en departamentos.
    
    Permite:
    - Crear/editar roles (Gerente/Empleado) para empleados en departamentos específicos
    - Consultar histórico de roles
    - Filtrar por empleado, departamento, rol, etc.
    """
    queryset = EmploymentDepartmentRole.objects.all()
    serializer_class = EmploymentDepartmentRoleSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['employment__person__first_name', 'employment__person__last_name', 'department__name']
    
    def get_queryset(self):
        """
        Optimiza las consultas y permite filtrar por parámetros
        """
        queryset = self.queryset.select_related(
            'employment',
            'employment__person',
            'department'
        ).order_by('-start_date')
        
        # Filtros opcionales
        employment_id = self.request.query_params.get('employment', None)
        department_id = self.request.query_params.get('department', None)
        is_current = self.request.query_params.get('is_current', None)
        hierarchical_role = self.request.query_params.get('hierarchical_role', None)
        
        if employment_id:
            queryset = queryset.filter(employment_id=employment_id)
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        if is_current == 'true':
            queryset = queryset.filter(end_date__isnull=True)
        elif is_current == 'false':
            queryset = queryset.filter(end_date__isnull=False)
        
        if hierarchical_role:
            queryset = queryset.filter(hierarchical_role=hierarchical_role)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def current_managers(self, request):
        """
        Retorna todos los gerentes actuales (roles activos con hierarchical_role='MGR')
        """
        current_managers = self.get_queryset().filter(
            hierarchical_role='MGR',
            end_date__isnull=True
        )
        serializer = self.get_serializer(current_managers, many=True)
        return Response(serializer.data)


# --- VIEWSET PARA ROLES JERÁRQUICOS POR PERSONA (MATRIZ) ---

class PersonDepartmentRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los roles jerárquicos de personas en departamentos.
    Soporta organizaciones matriciales.
    """
    queryset = PersonDepartmentRole.objects.all()
    serializer_class = PersonDepartmentRoleSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['person__first_name', 'person__last_name', 'department__name']
    
    def get_queryset(self):
        queryset = self.queryset.select_related(
            'person',
            'department'
        ).order_by('-start_date')
        
        # Filtros opcionales
        person_id = self.request.query_params.get('person', None)
        department_id = self.request.query_params.get('department', None)
        is_current = self.request.query_params.get('is_current', None)
        hierarchical_role = self.request.query_params.get('hierarchical_role', None)
        
        if person_id:
            queryset = queryset.filter(person_id=person_id)
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        if is_current == 'true':
            queryset = queryset.filter(end_date__isnull=True)
        elif is_current == 'false':
            queryset = queryset.filter(end_date__isnull=False)
        
        if hierarchical_role:
            queryset = queryset.filter(hierarchical_role=hierarchical_role)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def current_managers(self, request):
        """
        Retorna todos los gerentes actuales (roles activos con hierarchical_role='MGR')
        """
        current_managers = self.get_queryset().filter(
            hierarchical_role='MGR',
            end_date__isnull=True
        )
        serializer = self.get_serializer(current_managers, many=True)
        return Response(serializer.data)
