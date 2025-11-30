"""
Script para crear datos de prueba del módulo ATS
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from organization.models import Department, JobTitle, Position
from ats.models import JobPosting

# Limpiar datos anteriores de ATS
print("Limpiando datos anteriores...")
JobPosting.objects.all().delete()

# Crear departamentos si no existen
print("Creando departamentos...")
it_dept, _ = Department.objects.get_or_create(name="Tecnología e Informática")
rrhh_dept, _ = Department.objects.get_or_create(name="Recursos Humanos")
admin_dept, _ = Department.objects.get_or_create(name="Administración")

# Crear job titles
print("Creando job titles...")
dev_title, _ = JobTitle.objects.get_or_create(
    name="Desarrollador Full Stack",
    defaults={'description': 'Desarrollador de software con experiencia en frontend y backend'}
)
hr_title, _ = JobTitle.objects.get_or_create(
    name="Analista de RRHH",
    defaults={'description': 'Analista de recursos humanos'}
)
admin_title, _ = JobTitle.objects.get_or_create(
    name="Asistente Administrativo",
    defaults={'description': 'Asistente en tareas administrativas'}
)

# Crear posiciones
print("Creando posiciones...")
dev_position, _ = Position.objects.get_or_create(
    department=it_dept,
    job_title=dev_title,
    defaults={'vacancies': 2}
)
hr_position, _ = Position.objects.get_or_create(
    department=rrhh_dept,
    job_title=hr_title,
    defaults={'vacancies': 1}
)
admin_position, _ = Position.objects.get_or_create(
    department=admin_dept,
    job_title=admin_title,
    defaults={'vacancies': 1}
)

# Crear vacantes publicadas
print("Creando vacantes...")

# Vacante 1: Desarrollador (pide educación, experiencia y portafolio)
job1 = JobPosting.objects.create(
    title="Desarrollador Full Stack Senior",
    description="""Buscamos un desarrollador full stack con sólida experiencia en tecnologías modernas.

Responsabilidades:
- Diseñar y desarrollar aplicaciones web escalables
- Colaborar con el equipo en la arquitectura de soluciones
- Mantener y optimizar sistemas existentes
- Participar en code reviews y mentoría

Ofrecemos:
- Ambiente de trabajo dinámico e innovador
- Oportunidades de crecimiento profesional
- Capacitación continua en nuevas tecnologías
- Beneficios competitivos""",
    position=dev_position,
    department=it_dept,
    salary_range="$1,200 - $2,000 USD",
    location="Caracas / Remoto",
    ask_education=True,
    ask_experience=True,
    ask_portfolio=True,
    status='PUBLISHED',
    published_date=date.today(),
    closing_date=date.today() + timedelta(days=30)
)

# Vacante 2: Analista RRHH (pide educación, NO experiencia, NO portafolio)
job2 = JobPosting.objects.create(
    title="Analista de Recursos Humanos Junior",
    description="""Estamos en búsqueda de un Analista de RRHH para unirse a nuestro equipo.

Responsabilidades:
- Apoyar en procesos de reclutamiento y selección
- Gestionar expedientes de personal
- Coordinar capacitaciones y desarrollo
- Participar en evaluaciones de desempeño

Requisitos:
- Título universitario en RRHH, Psicología o afines
- Excelentes habilidades de comunicación
- Capacidad de trabajo en equipo
- Manejo de MS Office

Ofrecemos:
- Oportunidad de aprender y crecer
- Ambiente laboral positivo
- Beneficios de ley y adicionales""",
    position=hr_position,
    department=rrhh_dept,
    salary_range="$800 - $1,000 USD",
    location="Caracas",
    ask_education=True,
    ask_experience=False,
    ask_portfolio=False,
    status='PUBLISHED',
    published_date=date.today(),
    closing_date=date.today() + timedelta(days=45)
)

# Vacante 3: Asistente Administrativo (NO pide educación, NO experiencia, NO portafolio)
job3 = JobPosting.objects.create(
    title="Asistente Administrativo",
    description="""Necesitamos un Asistente Administrativo organizado y proactivo.

Responsabilidades:
- Gestión de documentos y archivo
- Atención telefónica y recepción
- Apoyo en tareas administrativas generales
- Coordinación de reuniones y eventos

Requisitos:
- Bachiller o estudiante universitario
- Experiencia deseable pero no excluyente
- Manejo de herramientas ofimáticas
- Excelente actitud de servicio

Ofrecemos:
- Estabilidad laboral
- Horario flexible
- Ambiente de trabajo agradable""",
    position=admin_position,
    department=admin_dept,
    salary_range="$500 - $700 USD",
    location="Caracas",
    ask_education=False,
    ask_experience=False,
    ask_portfolio=False,
    status='PUBLISHED',
    published_date=date.today(),
    closing_date=date.today() + timedelta(days=60)
)

# Agregar objetivos y requisitos a las posiciones
print("Agregando objetivos y requisitos...")

# Objetivos para Desarrollador
dev_position.objectives.get_or_create(description="Desarrollar software de alta calidad que cumpla con los estándares de la industria")
dev_position.objectives.get_or_create(description="Innovar en la implementación de nuevas tecnologías")
dev_position.objectives.get_or_create(description="Colaborar efectivamente con equipos multidisciplinarios")

dev_position.requirements.get_or_create(description="Experiencia mínima de 3 años en desarrollo web")
dev_position.requirements.get_or_create(description="Dominio de JavaScript/TypeScript y frameworks modernos (React, Next.js)")
dev_position.requirements.get_or_create(description="Experiencia con Python/Django o Node.js")
dev_position.requirements.get_or_create(description="Conocimientos de bases de datos SQL y NoSQL")
dev_position.requirements.get_or_create(description="Inglés técnico nivel intermedio")

# Objetivos para Analista RRHH
hr_position.objectives.get_or_create(description="Atraer y retener el mejor talento para la organización")
hr_position.objectives.get_or_create(description="Mantener la satisfacción y desarrollo del personal")

hr_position.requirements.get_or_create(description="Título universitario en carreras afines")
hr_position.requirements.get_or_create(description="Habilidades de comunicación efectiva")
hr_position.requirements.get_or_create(description="Capacidad de análisis y organización")

# Objetivos para Asistente
admin_position.objectives.get_or_create(description="Garantizar el funcionamiento eficiente de las operaciones administrativas")
admin_position.requirements.get_or_create(description="Bachiller completo")
admin_position.requirements.get_or_create(description="Manejo básico de computadoras")

print("\n✅ Datos de prueba creados exitosamente!")
print(f"\nVacantes creadas:")
print(f"1. {job1.title} - {job1.department.name}")
print(f"   Pide: Educación✓ Experiencia✓ Portafolio✓")
print(f"2. {job2.title} - {job2.department.name}")
print(f"   Pide: Educación✓ Experiencia✗ Portafolio✗")
print(f"3. {job3.title} - {job3.department.name}")
print(f"   Pide: Educación✗ Experiencia✗ Portafolio✗")
print(f"\n👉 Accede a http://localhost:3000/ para ver el portal público")
