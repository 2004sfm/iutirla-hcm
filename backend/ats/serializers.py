from rest_framework import serializers
from .models import JobPosting, Candidate, CandidateEducation, CandidateLog
from organization.models import Position, Department
from core.models import PhoneCarrierCode


# --- Serializers para Educación y Experiencia (Anidados) ---

class CandidateEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateEducation
        fields = ['id', 'school_name', 'level_name', 'field_name', 'start_date', 'end_date']





class PhoneCarrierCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhoneCarrierCode
        fields = ['id', 'code', 'carrier']


# --- Serializers para JobPosting ---

class JobPostingListSerializer(serializers.ModelSerializer):
    """Serializer para listar vacantes en el portal público (solo campos públicos)"""
    department_name = serializers.CharField(source='position.department.name', read_only=True)
    position_title = serializers.CharField(source='position.job_title.name', read_only=True, allow_null=True)
    candidates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'location', 
            'department_name', 'position_title',
            'published_date', 'closing_date', 'candidates_count'
        ]
    
    def get_candidates_count(self, obj):
        return obj.candidates.count()


class JobPostingDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para ver una vacante específica (incluye configuración)"""
    department_name = serializers.CharField(source='position.department.name', read_only=True)
    position_title = serializers.CharField(source='position.job_title.name', read_only=True, allow_null=True)
    position_objective = serializers.CharField(source='position.objective', read_only=True, allow_null=True)
    position_objectives = serializers.SerializerMethodField()
    position_requirements = serializers.SerializerMethodField()
    position_functions = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'description', 'location',
            'department_name',
            'position', 'position_title', 'position_objective', 
            'position_objectives', 'position_requirements', 'position_functions',
            'ask_education',
            'status', 'published_date', 'closing_date',
            'created_at', 'updated_at'
        ]
    
    
    def get_position_objectives(self, obj):
        # Position has 'objective' (singular TextField), not 'objectives'
        if obj.position and obj.position.objective:
            return [obj.position.objective]  # Return as list for consistency
        return []
    
    def get_position_requirements(self, obj):
        # Position has 'requirements' related_name from PositionRequirement model
        if obj.position:
            return [{'id': r.id, 'description': r.description, 'order': r.id} for r in obj.position.requirements.all()]
        return []
    
    def get_position_functions(self, obj):
        # Position has 'functions' related_name from PositionFunction model
        if obj.position:
            return [{'id': f.id, 'description': f.description, 'order': f.order} for f in obj.position.functions.all()]
        return []


class JobPostingAdminSerializer(serializers.ModelSerializer):
    """Serializer para administración completa de vacantes"""
    candidates_count = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='position.department.name', read_only=True)
    position_title = serializers.CharField(source='position.job_title.name', read_only=True, allow_null=True)
    
    class Meta:
        model = JobPosting
        fields = '__all__'
    
    def get_candidates_count(self, obj):
        return obj.candidates.count()

    def validate(self, data):
        """Validar que la posición tenga cupos disponibles y no haya vacantes duplicadas"""
        position = data.get('position')
        status = data.get('status', 'DRAFT')  # Obtener el estado que se está intentando guardar
        
        # Solo validamos si se está asignando una posición
        if position:
            # 1. Validar que no exista otra vacante PUBLISHED para la misma posición
            # Solo si intentamos publicar esta vacante
            if status == 'PUBLISHED':
                existing_posting = JobPosting.objects.filter(
                    position=position,
                    status='PUBLISHED'
                )
                if self.instance:
                    existing_posting = existing_posting.exclude(pk=self.instance.pk)
                
                if existing_posting.exists():
                    raise serializers.ValidationError({
                        "position": f"Ya existe una vacante publicada para la posición '{position.name or position.job_title.name}'. No se pueden publicar dos vacantes simultáneamente para la misma posición."
                    })

            # 2. Contar empleados activos en esta posición
            from employment.models import Employment, is_active_status
            
            # Obtener todos los empleados de esta posición y filtrar por activos
            all_employments = Employment.objects.filter(position=position)
            active_employees_count = sum(1 for emp in all_employments if is_active_status(emp.current_status))
            
            # Verificar si hay vacantes disponibles
            # Cupos libres = Total Vacantes - Empleados Activos
            if active_employees_count >= position.vacancies:
                raise serializers.ValidationError({
                    "position": f"No se puede crear la vacante. La posición '{position.name or position.job_title.name}' ya está ocupada al 100% ({active_employees_count}/{position.vacancies} ocupados)."
                })
        
        # Validar título solo letras y espacios
        title = data.get('title')
        if title:
            import re
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', title):
                raise serializers.ValidationError({"title": "El título solo puede contener letras y espacios."})

        return data


# --- Serializers para Candidate ---

class CandidateCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear candidato desde el portal público (postulación)"""
    education = CandidateEducationSerializer(many=True, required=False)
    class Meta:
        model = Candidate
        fields = [
            'job_posting', 'first_name', 'last_name', 'email',
            'phone_area_code', 'phone_subscriber', 'phone',  # Ambos formatos
            'national_id', 'cv_file', 'avatar',
            'education'
        ]
        extra_kwargs = {
            'phone': {'required': False},  # Opcional, para retrocompatibilidad
            'phone_area_code': {'required': False},
            'phone_subscriber': {'required': False},
        }
    
    def validate_email(self, value):
        """Validar que el email no pertenezca a un empleado existente"""
        from core.models import PersonEmail
        
        if PersonEmail.objects.filter(email_address=value).exists():
            raise serializers.ValidationError(
                "Este correo electrónico ya está registrado en el sistema. "
                "Si ya trabajas en la institución, por favor contacta al departamento de RRHH."
            )
        return value
    
    def validate_national_id(self, value):
        """Validar que la cédula no pertenezca a un empleado existente"""
        from core.models import NationalId
        import re
        
        # El valor puede venir como "V-12345678" o solo "12345678"
        # Limpiar y parsear
        cleaned = value.strip().upper()
        
        # Intentar extraer tipo y número
        match = re.match(r'^([VEJGP])-?(\d+)$', cleaned)
        if match:
            doc_type = match.group(1)
            doc_number = match.group(2)
            
            # Verificar si ya existe en NationalId
            if NationalId.objects.filter(document_type=doc_type, number=doc_number).exists():
                raise serializers.ValidationError(
                    "Esta cédula ya está registrada en el sistema. "
                    "Si ya trabajas en la institución, por favor contacta al departamento de RRHH."
                )
        
        return value

    def to_internal_value(self, data):
        # Si data es un QueryDict (multipart), convertir a dict estándar
        # para evitar problemas al asignar listas de objetos (education)
        if hasattr(data, 'dict') or hasattr(data, '_mutable'):
            data_dict = {}
            for key, value in data.items():
                data_dict[key] = value
            data = data_dict
        
        # Parsear education si viene como JSON string
        if 'education' in data and isinstance(data['education'], str):
            import json
            try:
                data['education'] = json.loads(data['education'])
            except json.JSONDecodeError:
                data['education'] = []
            
        return super().to_internal_value(data)
    
    def validate(self, data):
        """Validación cruzada de teléfono y otros campos"""
        from core.models import PersonPhone
        

        
        # Validar que se proporcione teléfono (en algún formato)
        phone_area_code = data.get('phone_area_code')
        phone_subscriber = data.get('phone_subscriber')
        old_phone = data.get('phone')
        
        # Considerar que los campos pueden venir como strings vacíos
        if phone_area_code and phone_subscriber:
            has_new_format = True
        else:
            has_new_format = False
            
        has_old_format = bool(old_phone and old_phone.strip())
        
        if not (has_new_format or has_old_format):
            raise serializers.ValidationError({
                'phone': 'Debes proporcionar un número de teléfono.'
            })
        
        # Si se usa el nuevo formato, validar contra PersonPhone
        if has_new_format:
            if PersonPhone.objects.filter(carrier_code=phone_area_code, subscriber_number=phone_subscriber).exists():
                raise serializers.ValidationError({
                    'phone_subscriber': (
                        "Este número de teléfono ya está registrado en el sistema. "
                        "Si ya trabajas en la institución, por favor contacta al departamento de RRHH."
                    )
                })
        
        # Validación de email duplicado en misma vacante
        job_posting = data.get('job_posting')
        if job_posting and data.get('email'):
            existing = Candidate.objects.filter(
                job_posting=job_posting,
                email=data['email']
            )
            if existing.exists():
                raise serializers.ValidationError({
                    'email': 'Ya te has postulado a esta vacante con este correo electrónico.'
                })
        
        if job_posting:
            # Validar que se incluya educación si la vacante lo requiere
            if job_posting.ask_education:
                education = data.get('education', [])
                if not education or len(education) == 0:
                    raise serializers.ValidationError({
                        'education': 'Esta vacante requiere información educativa.'
                    })
        
        return data
    
    def create(self, validated_data):
        import json
        
        # Parsear education si viene como JSON string (desde FormData)
        education_data = validated_data.pop('education', [])
        if isinstance(education_data, str):
            try:
                education_data = json.loads(education_data)
            except json.JSONDecodeError:
                education_data = []
        
        # Crear el candidato
        candidate = Candidate.objects.create(**validated_data)
        
        # Crear educación
        for edu in education_data:
            CandidateEducation.objects.create(candidate=candidate, **edu)
        
        return candidate


class CandidateListSerializer(serializers.ModelSerializer):
    """Serializer para listar candidatos (vista administrativa)"""
    job_posting_title = serializers.CharField(source='job_posting.title', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    phone_area_code = PhoneCarrierCodeSerializer(read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'job_posting', 'job_posting_title',
            'stage', 'stage_display',
            'created_at', 'updated_at', 'avatar',
            'national_id', 'phone_area_code', 'phone_subscriber'
        ]


class CandidateDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para administración de candidatos"""
    job_posting_title = serializers.CharField(source='job_posting.title', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    education = CandidateEducationSerializer(many=True, read_only=True)
    phone_area_code = PhoneCarrierCodeSerializer(read_only=True)
    cv_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = '__all__'
    
    def get_cv_url(self, obj):
        if obj.cv_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv_file.url)
        return None


class CandidateStageUpdateSerializer(serializers.Serializer):
    """Serializer para cambiar la etapa de un candidato"""
    stage = serializers.ChoiceField(choices=Candidate.STAGE_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class HireCandidateSerializer(serializers.Serializer):
    """Serializer para el proceso de contratación"""
    hire_date = serializers.DateField()
    role = serializers.CharField(help_text="Código del Role (EMP, MGR)")
    employment_type = serializers.CharField(help_text="Código del EmploymentType (FIJ, TMP, PAS)")
    employment_status = serializers.CharField(help_text="Código del EmploymentStatus (ACT, SUS, etc)")
    end_date = serializers.DateField(required=False, allow_null=True)
    salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class CandidateLogSerializer(serializers.ModelSerializer):
    """Serializer para el historial de cambios"""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CandidateLog
        fields = ['id', 'user', 'user_name', 'action', 'details', 'timestamp']
        
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return "Sistema"
