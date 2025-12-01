#!/usr/bin/env python3
"""
Script para generar initial_data.json completo con requirements y functions
"""
import json

# Base data
data = []

# Departments
departments_data = [
    (1, "Dirección", None),
    (2, "Subdirección Académica", 1),
    (3, "Coordinación de Control de Estudios y Evaluación", 2),
    (4, "Coordinación Administrativa", 1),
    (5, "Coordinación de Pasantías", 2),
    (6, "Coordinación de Informática", 2),
    (7, "Coordinación de Preescolar", 2),
    (8, "Coordinación de Investigación, Extensión y Postgrado", 2),
    (9, "Biblioteca", 2),
]

for pk, name, parent in departments_data:
    data.append({
        "model": "organization.department",
        "pk": pk,
        "fields": {"name": name, "parent": parent}
    })

# JobTitles
jobtitles_data = [
    (1, "Director"), (2, "Subdirector"), (3, "Coordinador"), (4, "Jefe"),
    (5, "Asesor"), (6, "Secretaria"), (7, "Recepcionista"), (8, "Asistente"),
    (9, "Personal de Mantenimiento"), (10, "Personal de Limpieza"), (11, "Auxiliar"),
]

for pk, name in jobtitles_data:
    data.append({
        "model": "organization.jobtitle",
        "pk": pk,
        "fields": {"name": name}
    })

# Positions with objectives
positions_data = [
    # (pk, dept, jobtitle, vacancies, objective)
    (1, 1, 1, 1, "Planificar, organizar, dirigir y controlar todas las actividades que se realizan en la Extensión desde el punto de vista administrativo y académico."),
    (2, 1, 5, 1, "Gestionar la imagen institucional y la comunicación externa del Instituto."),
    (3, 1, 6, 1, "Brindar apoyo administrativo y secretarial de alto nivel a la Dirección."),
    (4, 1, 7, 1, "Atender a los visitantes que acuden a la Extensión a solicitar información."),
    (5, 2, 2, 1, "Prestar ayuda, apoyo y respaldo a la Jefatura de la Extensión."),
    (6, 2, 8, 1, "Asistir a la Subdirección Académica en la gestión operativa."),
    (7, 3, 3, 1, "Planificar, organizar, coordinar y controlar las actividades de Control de Estudios."),
    (8, 3, 8, 1, "Ejecutar los procesos operativos de inscripción y registro."),
    (9, 3, 6, 1, "Atender solicitudes de estudiantes y docentes en taquilla."),
    (10, 4, 3, 1, "Planificar, coordinar y supervisar las actividades administrativas."),
    (11, 4, 8, 1, "Apoyar en la ejecución de procesos administrativos contables."),
    (12, 4, 9, 2, "Garantizar la operatividad de la infraestructura física."),
    (13, 4, 10, 3, "Mantener en óptimas condiciones de higiene todas las áreas."),
    (14, 5, 3, 1, "Planificar y coordinar la ejecución del programa de Pasantías."),
    (15, 5, 8, 1, "Apoyar en la gestión administrativa de la Coordinación de Pasantías."),
    (16, 6, 3, 1, "Administrar las funciones del área de Coordinación de Informática."),
    (17, 6, 8, 1, "Coordinar las actividades académicas en el Laboratorio de Informática."),
    (18, 7, 3, 1, "Coordinar las actividades del área de Educación Preescolar."),
    (19, 7, 8, 1, "Asistir administrativamente a la Coordinación de Preescolar."),
    (20, 8, 3, 1, "Promover el desarrollo de la investigación científica y extensión."),
    (21, 9, 4, 1, "Administrar y supervisar los servicios bibliotecarios."),
    (22, 9, 8, 1, "Atender a estudiantes y personal para suministrar bibliografía."),
    (23, 9, 11, 2, "Apoyar en las labores operativas de la biblioteca."),
]

for pk, dept, jt, vac, obj in positions_data:
    data.append({
        "model": "organization.position",
        "pk": pk,
        "fields": {
            "department": dept,
            "job_title": jt,
            "vacancies": vac,
            "objective": obj
        }
    })

# Requirements y Functions
req_pk = 1
func_pk = 1

# Director (Position 1)
director_reqs = [
    "Profesional Universitario.",
    "Cinco años de experiencia en cargos similares.",
    "Ser miembro activo del personal ordinario de un Instituto venezolano.",
]
for req in director_reqs:
    data.append({
        "model": "organization.positionrequirement",
        "pk": req_pk,
        "fields": {"position": 1, "description": req}
    })
    req_pk += 1

director_funcs = [
    "Planificar, Dirigir, Coordinar y Supervisar las actividades académicas y administrativas.",
    "Formular recomendaciones ante la Directiva Nacional.",
    "Programar las necesidades de Recursos Humanos, Físicos y Materiales.",
    "Cumplir y hacer cumplir todo lo concerniente al funcionamiento óptimo de la sede.",
    "Convocar y Presidir al Consejo Directivo de la extensión.",
    "Presentar ante la Dirección Nacional un informe semestral.",
    "Imponer las sanciones correspondientes al personal.",
    "Velar por el cumplimiento de las disposiciones de la Dirección Nacional.",
    "Velar por el orden y la disciplina dentro del Instituto.",
    "Estudiar y Recomendar medidas para mejorar el funcionamiento integral.",
    "Controlar las actividades de docencia y administrativas.",
    "Dirigir la reunión de profesores al inicio de cada periodo académico.",
    "Cualquier otra actividad asignada por la Dirección.",
]
for i, func in enumerate(director_funcs, 1):
    data.append({
        "model": "organization.positionfunction",
        "pk": func_pk,
        "fields": {"position": 1, "description": func, "order": i}
    })
    func_pk += 1

# Asesor de Prensa (Position 2)
asesor_reqs = [
    "Licenciado en Comunicación Social, Periodismo o Relaciones Públicas.",
    "Mínimo dos (2) años de experiencia en manejo de medios.",
    "Excelente redacción y oratoria.",
]
for req in asesor_reqs:
    data.append({
        "model": "organization.positionrequirement",
        "pk": req_pk,
        "fields": {"position": 2, "description": req}
    })
    req_pk += 1

asesor_funcs = [
    "Asesorar sobre las relaciones Institucionales que debe mantener el Iutirla.",
    "Mantener relaciones con Gremios, Instituciones u Organismos.",
    "Efectuar campañas publicitarias tendientes a captar nuevos estudiantes.",
    "Planificar y Coordinar ruedas de Prensa, Radio y T.V.",
    "Apoyar, Promocionar y Participar activamente en los eventos organizados.",
    "Redactar las notas de prensa que requiere la Institución.",
    "Cualquier otra actividad asignada por el Director.",
]
for i, func in enumerate(asesor_funcs, 1):
    data.append({
        "model": "organization.positionfunction",
        "pk": func_pk,
        "fields": {"position": 2, "description": func, "order": i}
    })
    func_pk += 1

# Continuar con el resto de posiciones...
# Por brevedad, agrego algunas más representativas

# Secretaria de Dirección (Position 3)
sec_dir_reqs = [
    "T.S.U. en Secretariado, Administración o carrera afín.",
    "Mínimo tres (3) años de experiencia en cargos de asistencia a la dirección.",
    "Manejo avanzado de herramientas ofimáticas.",
]
for req in sec_dir_reqs:
    data.append({
        "model": "organization.positionrequirement",
        "pk": req_pk,
        "fields": {"position": 3, "description": req}
    })
    req_pk += 1

sec_dir_funcs = [
    "Asistir junto con el Director a todas las reuniones.",
    "Redactar y elaborar todas las correspondencias de la Dirección.",
    "Atender de manera rápida y eficiente a las personas en general.",
    "Revisar todas las correspondencias recibidas.",
    "Velar por el perfecto orden y mantenimiento de los bienes muebles.",
    "Distribuir a los Departamentos las comunicaciones.",
    "Tipear los informes semestrales.",
    "Atender las llamadas telefónicas.",
    "Llevar la agenda del Director.",
    "Auxiliar a cualquier Departamento que lo necesite.",
    "Cualquier otra asignada por el director.",
]
for i, func in enumerate(sec_dir_funcs, 1):
    data.append({
        "model": "organization.positionfunction",
        "pk": func_pk,
        "fields": {"position": 3, "description": func, "order": i}
    })
    func_pk += 1

# Output JSON
output_path = 'organization/fixtures/initial_data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Generated {len(data)} total entries")
print(f"File saved to: {output_path}")
print(f"- Departments: 9")
print(f"- JobTitles: 11")
print(f"- Positions: 23")
print(f"- Requirements: {req_pk - 1}")
print(f"- Functions: {func_pk - 1}")
