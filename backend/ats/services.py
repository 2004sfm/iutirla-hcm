from django.db import transaction
from django.db.models import F
from django.core.exceptions import ValidationError
from core.models import Person
from talent.models import PersonEducation, EducationLevel, FieldOfStudy
from employment.models import (
    Employment, 
    RoleChoices, 
    EmploymentTypeChoices, 
    EmploymentStatusChoices
)
from .models import Candidate, CandidateEducation


@transaction.atomic
def hire_candidate(candidate, hire_data):
    """
    Transacción atómica para contratar un candidato.
    
    Proceso:
    1. Validar cupos disponibles
    2. Crear Person (migrar identidad)
    3. Migrar educación a PersonEducation
    4. Crear Employment
    5. Actualizar estado del candidato
    6. Decrementar vacantes
    7. Detectar otros finalistas
    
    Args:
        candidate: Instancia de Candidate
        hire_data: Dict con {hire_date, role, employment_type, employment_status, salary, notes}
                   Ahora los valores son códigos de Choice (ej: 'EMP', 'FIJ', 'ACT')
    
    Returns:
        Dict: {person, employment, other_finalists}
    
    Raises:
        ValidationError: Si no hay cupos disponibles
    """
    
    # 1. Validar cupos disponibles con bloqueo optimista
    position = candidate.job_posting.position
    
    if not position:
        raise ValidationError("La vacante no tiene una posición asignada.")
    
    # Bloqueo de fila para evitar condiciones de carrera
    position = position.__class__.objects.select_for_update().get(pk=position.pk)
    
    if position.vacancies <= 0:
        raise ValidationError(
            f"No hay cupos disponibles para la posición '{position}'. "
            f"Vacantes actuales: {position.vacancies}"
        )
    
    # 2. Migración de identidad (Core) - Crear Person
    # Person solo tiene: first_name, second_name, paternal_surname, maternal_surname, 
    # salutation, gender, marital_status, birthdate, country_of_birth, photo
    person = Person.objects.create(
        first_name=candidate.first_name,
        paternal_surname=candidate.last_name,
        # Los campos opcionales se pueden agregar después
    )
    
    # 2.1 Crear NationalId (cédula) si existe
    if hasattr(candidate, 'national_id') and candidate.national_id:
        from core.models import NationalId
        # Parseamos el national_id del candidato (formato: V-12345678)
        national_id_str = str(candidate.national_id)
        if '-' in national_id_str:
            prefix, number = national_id_str.split('-', 1)
        else:
            prefix = 'V'  # Default
            number = national_id_str
        
        NationalId.objects.create(
            person=person,
            category='CEDULA',
            document_type=prefix,
            number=number,
            is_primary=True
        )
    
    # 2.2 Crear PersonEmail si existe
    if candidate.email:
        from core.models import PersonEmail
        PersonEmail.objects.create(
            person=person,
            email_address=candidate.email,
            is_primary=True
        )
    
    
    # 2.3 Crear PersonPhone si existe
    if hasattr(candidate, 'phone') and candidate.phone:
        from core.models import PersonPhone
        # Parsear el teléfono (asumiendo formato simple number o con código)
        phone_str = str(candidate.phone)
        PersonPhone.objects.create(
            person=person,
            subscriber_number=phone_str,
            is_primary=True
        )
    
    # 3. Migración del CV (simplificado para desarrollo local)
    # El archivo permanece en su ubicación original
    # En producción: aquí se movería a un bucket privado
    
    # 4. Migración de educación (Talent)
    for edu in candidate.education.all():
        # Intentar encontrar EducationLevel y FieldOfStudy existentes
        education_level, _ = EducationLevel.objects.get_or_create(
            name=edu.level_name
        )
        field_of_study, _ = FieldOfStudy.objects.get_or_create(
            name=edu.field_name
        )
        
        PersonEducation.objects.create(
            person=person,
            school_name=edu.school_name,
            level=education_level,
            field_of_study=field_of_study,
            start_date=edu.start_date,
            end_date=edu.end_date
        )
    
    # 5. Validar que los valores de Choice sean válidos
    role = hire_data.get('role', RoleChoices.EMPLOYEE)
    employment_type = hire_data.get('employment_type', EmploymentTypeChoices.PERMANENT)
    employment_status = hire_data.get('employment_status', EmploymentStatusChoices.ACTIVE)
    
    # Validar que sean valores válidos de Choices
    if role not in dict(RoleChoices.choices):
        raise ValidationError(f"Rol inválido: {role}")
    if employment_type not in dict(EmploymentTypeChoices.choices):
        raise ValidationError(f"Tipo de empleo inválido: {employment_type}")
    if employment_status not in dict(EmploymentStatusChoices.choices):
        raise ValidationError(f"Estatus inválido: {employment_status}")
    
    # 6. Crear contrato (Employment)
    employment = Employment.objects.create(
        person=person,
        position=position,
        role=role,
        employment_type=employment_type,
        current_status=employment_status,
        hire_date=hire_data['hire_date'],
        end_date=hire_data.get('end_date')  # Opcional para contratos temporales
    )
    
    # 7. Actualizar estado del candidato
    candidate.stage = 'HIRED'
    candidate.notes = (candidate.notes or '') + f"\n[CONTRATADO] {hire_data['hire_date']}"
    candidate.save()
    
    # 8. Decrementar vacante (de forma atómica)
    # AHORA SE MANEJA AUTOMÁTICAMENTE EN Employment.save()
    # position.refresh_from_db()
    # position.vacancies -= 1
    # position.save()
    
    # 9. Detectar otros finalistas (candidatos en etapas avanzadas)
    other_finalists = Candidate.objects.filter(
        job_posting=candidate.job_posting,
        stage__in=['OFF', 'INT']
    ).exclude(pk=candidate.pk)
    
    return {
        'person': person,
        'employment': employment,
        'other_finalists': list(other_finalists),
        'remaining_vacancies': position.vacancies
    }


def move_finalists_to_pool(candidate_ids):
    """
    Mover candidatos finalistas al banco de elegibles.
    
    Args:
        candidate_ids: Lista de IDs de candidatos
    
    Returns:
        int: Número de candidatos movidos
    """
    updated = Candidate.objects.filter(
        id__in=candidate_ids,
        stage__in=['OFF', 'INT']
    ).update(
        stage='POOL',
        notes=F('notes') + '\n[Movido a Banco de Elegibles automáticamente]'
    )
    
    return updated
