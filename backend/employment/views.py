from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Count
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Role, EmploymentType, EmploymentStatus, 
    Employment, EmploymentStatusLog 
)
from .serializers import (
    RoleSerializer, EmploymentTypeSerializer, EmploymentStatusSerializer, 
    EmploymentSerializer, EmployeeListSerializer, EmploymentStatusLogSerializer # <--- NOMBRE CORREGIDO
)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EmploymentTypeViewSet(viewsets.ModelViewSet):
    queryset = EmploymentType.objects.all()
    serializer_class = EmploymentTypeSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EmploymentStatusViewSet(viewsets.ModelViewSet):
    queryset = EmploymentStatus.objects.all()
    serializer_class = EmploymentStatusSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

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
                'current_status', 
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
                # Buscar estatus de cierre
                closed_status = EmploymentStatus.objects.filter(
                    name__iexact='Finalizado', 
                    is_active_relationship=False
                ).first()

                if not closed_status:
                    closed_status = EmploymentStatus.objects.filter(is_active_relationship=False).first() 
                
                if not closed_status:
                    return Response({"error": "Error config estatus."}, status=500)

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
        active_qs = Employment.objects.filter(current_status__is_active_relationship=True)

        # KPIs
        total_active = active_qs.count()
        new_hires = active_qs.filter(hire_date__gte=start_of_month).count()
        exits = Employment.objects.filter(
            current_status__is_active_relationship=False,
            end_date__gte=start_of_month
        ).count()
        pending_users = active_qs.filter(person__user_account__isnull=True).count()

        # Deptos
        dept_stats = active_qs.values('position__department__name') \
            .annotate(count=Count('id')).order_by('-count')[:5]

        # Vencimientos (con cédula)
        next_month = today + timedelta(days=30)
        expiring_qs = active_qs.filter(end_date__range=[today, next_month]).select_related('person')

        expiring_list = []
        for emp in expiring_qs:
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
        my_job = Employment.objects.filter(
            person=user.person, 
            current_status__is_active_relationship=True
        ).select_related('position__department', 'position__manager_position').first()

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
            boss_employment = Employment.objects.filter(
                position=boss_pos,
                current_status__is_active_relationship=True
            ).select_related('person').first()
            
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
            peers = Employment.objects.filter(
                position__department=my_job.position.department,
                current_status__is_active_relationship=True
            ).exclude(id=my_job.id).select_related('person', 'position')[:10]

            data["peers"] = [{
                "name": str(p.person),
                "position": p.position.name,
                "photo": p.person.photo.url if p.person.photo else None
            } for p in peers]

        # Subordinados (Si soy jefe)
        subordinates = Employment.objects.filter(
            position__manager_position=my_job.position,
            current_status__is_active_relationship=True
        ).select_related('person', 'position')

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
            person=user.person,
            current_status__is_active_relationship=True
        ).select_related('position', 'position__department', 'position__job_title') # Agregamos job_title por si acaso

        departments_map = {}

        for emp in my_employments:
            dept = emp.position.department
            dept_id = dept.id if dept else 0
            dept_name = dept.name if dept else "Sin Departamento Asignado"
            dept_desc = getattr(dept, 'description', 'Área general.') if dept else "Posición fuera de estructura."

            # --- CORRECCIÓN AQUÍ ---
            # Determinamos el nombre del cargo de forma segura
            pos_name = emp.position.name
            
            # Si pos_name es None, intentamos usar el Job Title o un fallback
            if not pos_name:
                if emp.position.job_title:
                    pos_name = emp.position.job_title.name
                else:
                    pos_name = "Cargo Sin Nombre"
            # -----------------------

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

# CAMBIO DE NOMBRE: History -> Log para coincidir con el modelo
class EmploymentStatusLogViewSet(viewsets.ModelViewSet):
    queryset = EmploymentStatusLog.objects.all()
    serializer_class = EmploymentStatusLogSerializer # Usamos el nuevo serializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
