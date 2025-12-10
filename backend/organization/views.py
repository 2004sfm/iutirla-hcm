from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Department, JobTitle, Position, PositionRequirement, PositionFunction
from .serializers import DepartmentSerializer, JobTitleSerializer, PositionSerializer, PositionRequirementSerializer, PositionFunctionSerializer

from core.filters import UnaccentSearchFilter

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_departments(self, request):
        """
        Returns departments where the authenticated user has active employment.
        """
        from employment.models import Employment, is_active_status
        
        # Get user's active employments
        # User -> Person relationship uses related_name='user_account'
        active_employments = Employment.objects.filter(
            person__user_account=request.user
        ).select_related('position__department', 'position__job_title', 'person')
        
        # Filter only active employments
        active_employments = [emp for emp in active_employments if is_active_status(emp.current_status)]
        
        # Extract unique departments
        departments_data = []
        seen_dept_ids = set()
        
        for emp in active_employments:
            if emp.position and emp.position.department:
                dept = emp.position.department
                if dept.id not in seen_dept_ids:
                    seen_dept_ids.add(dept.id)
                    
                    # Find manager of this department
                    manager_info = None
                    # Look for positions marked as manager in this department
                    manager_positions = Position.objects.filter(
                        department=dept,
                        is_manager=True
                    ).select_related('job_title')
                    
                    for manager_pos in manager_positions:
                        # Find who currently occupies this manager position
                        manager_emps = Employment.objects.filter(
                            position=manager_pos
                        ).select_related('person')
                        
                        for manager_emp in manager_emps:
                            if is_active_status(manager_emp.current_status):
                                manager_info = {
                                    'name': str(manager_emp.person),
                                    'position': str(manager_pos)
                                }
                                break
                        if manager_info:
                            break
                    
                    departments_data.append({
                        'id': dept.id,
                        'name': dept.name,
                        'manager': manager_info,
                        'user_position': str(emp.position),
                    })
        
        return Response(departments_data)
    
        return Response(departments_data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def institutional_chart(self, request):
        """
        Returns all departments for the organization chart with manager position and person info.
        """
        from employment.models import Employment, is_active_status
        
        departments = Department.objects.all()
        departments_data = []
        
        for dept in departments:
            # Serialize basic department data
            dept_serializer = DepartmentSerializer(dept)
            dept_data = dept_serializer.data
            
            # Find manager position for this department (show even if vacant)
            manager_position = None
            manager_info = None
            manager_pos = Position.objects.filter(
                department=dept,
                is_manager=True
            ).select_related('job_title').first()
            
            if manager_pos and manager_pos.job_title:
                manager_position = manager_pos.job_title.name
                
                # Find who currently occupies this position
                manager_emp = Employment.objects.filter(
                    position=manager_pos
                ).select_related('person').first()
                
                if manager_emp and is_active_status(manager_emp.current_status):
                    # Get absolute photo URL
                    photo_url = None
                    if manager_emp.person.photo:
                        photo_url = request.build_absolute_uri(manager_emp.person.photo.url)
                    
                    manager_info = {
                        'id': manager_emp.person.id,
                        'name': str(manager_emp.person),
                        'photo': photo_url,
                    }
            
            dept_data['manager_position'] = manager_position
            dept_data['manager_info'] = manager_info
            departments_data.append(dept_data)
        
        return Response(departments_data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='export-institutional-chart')
    def export_institutional_chart(self, request):
        """
        Exports provided SVG content to PDF or returns SVG for the institutional org chart.
        POST body: { "format": "svg" | "pdf", "svg_content": "<svg>..." }
        """
        from django.http import HttpResponse
        
        export_format = request.data.get('format', 'pdf')
        svg_content = request.data.get('svg_content', '')
        
        if not svg_content:
            return Response({'error': 'SVG content is required'}, status=400)
            
        if export_format == 'svg':
            response = HttpResponse(svg_content, content_type='image/svg+xml')
            response['Content-Disposition'] = 'attachment; filename="organigrama-institucional.svg"'
            return response
        else:  # pdf
            import cairosvg
            # Convert SVG to PDF
            pdf_bytes = cairosvg.svg2pdf(bytestring=svg_content.encode('utf-8'))
            
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="organigrama-institucional.pdf"'
            return response

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='detail')
    def department_detail(self, request, pk=None):
        """
        Returns detailed department info including all positions and their current occupants.
        """
        from employment.models import Employment, is_active_status
        
        department = self.get_object()
        
        # Get all positions in this department
        positions = Position.objects.filter(
            department=department
        ).select_related('job_title').prefetch_related('manager_positions__job_title')
        
        positions_data = []
        manager_info = None
        
        for position in positions:
            # Get current occupants
            employments = Employment.objects.filter(
                position=position
            ).select_related('person').prefetch_related('person__emails')
            
            occupants = []
            for emp in employments:
                if is_active_status(emp.current_status):
                    # Get primary email
                    primary_email = emp.person.emails.filter(is_primary=True).first()
                    email = primary_email.email_address if primary_email else None
                    
                    # Get absolute photo URL
                    photo_url = None
                    if emp.person.photo:
                        photo_url = request.build_absolute_uri(emp.person.photo.url)
                    
                    occupants.append({
                        'id': emp.person.id,
                        'name': str(emp.person),
                        'email': email,
                        'photo': photo_url,
                        'hire_date': emp.hire_date,
                        'is_current_user': emp.person.user_account == request.user if emp.person.user_account else False
                    })
                    
                    # Track manager
                    if position.is_manager and not manager_info:
                        manager_info = {
                            'name': str(emp.person),
                            'position': position.job_title.name
                        }
            
            positions_data.append({
                'id': position.id,
                'name': position.job_title.name, # Solo el nombre del cargo
                'is_manager': position.is_manager,
                'vacancies': position.vacancies,
                'occupants': occupants,
                'manager_positions': [{'id': mp.id, 'name': mp.job_title.name} for mp in position.manager_positions.all()] # IDs y nombres para el organigrama
            })
        
        return Response({
            'id': department.id,
            'name': department.name,
            'manager': manager_info,
            'positions': positions_data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='export-org-chart')
    def export_org_chart(self, request, pk=None):
        """
        Exports provided SVG content to PDF or returns SVG.
        POST body: { "format": "svg" | "pdf", "svg_content": "<svg>..." }
        """
        from django.http import HttpResponse
        
        department = self.get_object()
        export_format = request.data.get('format', 'pdf')
        svg_content = request.data.get('svg_content', '')
        
        if not svg_content:
            return Response({'error': 'SVG content is required'}, status=400)
            
        if export_format == 'svg':
            response = HttpResponse(svg_content, content_type='image/svg+xml')
            response['Content-Disposition'] = f'attachment; filename="organigrama-{department.name}.svg"'
            return response
        else:  # pdf
            import cairosvg
            # Convert SVG to PDF
            pdf_bytes = cairosvg.svg2pdf(bytestring=svg_content.encode('utf-8'))
            
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="organigrama-{department.name}.pdf"'
            return response

class JobTitleViewSet(viewsets.ModelViewSet):
    queryset = JobTitle.objects.all()
    serializer_class = JobTitleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name']

from django_filters.rest_framework import DjangoFilterBackend

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all().select_related('department', 'job_title').prefetch_related('manager_positions', 'manager_positions__job_title', 'manager_positions__department')
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, UnaccentSearchFilter]
    filterset_fields = ['department', 'is_manager']
    search_fields = ['job_title__name', 'department__name']

class PositionRequirementViewSet(viewsets.ModelViewSet):
    serializer_class = PositionRequirementSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        position_id = self.kwargs.get('position_pk')
        if position_id:
            return PositionRequirement.objects.filter(position_id=position_id)
        return PositionRequirement.objects.all()
    
    def perform_create(self, serializer):
        position_id = self.kwargs.get('position_pk')
        serializer.save(position_id=position_id)

class PositionFunctionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionFunctionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['position']
    
    def get_queryset(self):
        position_id = self.kwargs.get('position_pk')
        if position_id:
            return PositionFunction.objects.filter(position_id=position_id)
        return PositionFunction.objects.all()
    
    def perform_create(self, serializer):
        position_id = self.kwargs.get('position_pk')
        serializer.save(position_id=position_id)