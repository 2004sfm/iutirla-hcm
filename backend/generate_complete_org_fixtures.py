#!/usr/bin/env python3
"""
SCRIPT COMPLETO para generar initial_data.json con TODOS los datos del manual
"""
import json

data = []

# ===== DEPARTMENTS =====
departments_data = [
    (1, "Dirección", None),
    (2, "Subdirección Académica", 1),
    (3, "Coordinación de Control de Estudios y Evaluación", 2),
    (4, "Coordinación Administrativa", 1),
    (5, "Coordinación de Pasant

ías", 2),
    (6, "Coordinación de Informática", 2),
    (7, "Coordinación de Preescolar", 2),
    (8, "Coordinación de Investigación, Extensión y Postgrado", 2),
    (9, "Biblioteca", 2),
]

for pk, name, parent in departments_data:
    data.append({"model": "organization.department", "pk": pk, "fields": {"name": name, "parent": parent}})

# ===== JOB TITLES =====
jobtitles_data = [
    (1, "Director"), (2, "Subdirector"), (3, "Coordinador"), (4, "Jefe"),
    (5, "Asesor"), (6, "Secretaria"), (7, "Recepcionista"), (8, "Asistente"),
    (9, "Personal de Mantenimiento"), (10, "Personal de Limpieza"), (11, "Auxiliar"),
]

for pk, name in jobt

itles_data:
    data.append({"model": "organization.jobtitle", "pk": pk, "fields": {"name": name}})

# ===== POSITIONS =====
# Shortened objectives for brevity
positions_data = [
    (1, 1, 1, 1, "Planificar, organizar, dirigir y controlar todas las actividades que se realizan en la Extensión desde el punto de vista administrativo y académico. A través del liderazgo, la supervisión y delegación de funciones, se responsabiliza por la buena marcha de la Institución dentro del marco de la misión, visión, valores, políticas, objetivos y planes establecidos por la Dirección Nacional, asegurándose de que éstos sean ejecutados."),
    (2, 1, 5, 1, "Gestionar la imagen institucional y la comunicación externa del Instituto, estableciendo vínculos efectivos con los medios de comunicación y organismos públicos o privados para promover la oferta académica y las actividades de la extensión."),
    (3, 1, 6, 1, "Brindar apoyo administrativo y secretarial de alto nivel a la Dirección, gestionando la agenda, la correspondencia y la atención al público, garantizando la confidencialidad y fluidez de la información en el despacho del Director."),
    (4, 1, 7, 1, "Atender a los visitantes que acuden a la Extensión a solicitar información y operar la central telefónica para recibir y efectuar las llamadas que le sean solicitadas."),
   (5, 2, 2, 1, "Prestar ayuda, apoyo y respaldo a la Jefatura de la Extensión, con el objeto de aportar su contribución, supervisando conjuntamente con el Jefe de la Extensión el desarrollo de las actividades que en las áreas académico-administrativo, deben realizarse para así mantener un mejor desenvolvimiento de la ejecución de todas las actividades de la Institución."),
    (6, 2, 8, 1, "Asistir a la Subdirección Académica en la gestión operativa y administrativa de los procesos docentes, manteniendo actualizados los registros del personal, horarios y programación académica para garantizar el flujo eficiente de la información."),
    (7, 3, 3, 1, "Planificar, organizar, coordinar y controlar las actividades de la Coordinación de Control de Estudios y Evaluación, desarrollando el programa de seguimiento de los estudiantes y profesores, para el registro de la documentación que deba procesarse a fin de garantizar el fiel cumplimiento de los objetivos de esta área."),
    (8, 3, 8, 1, "Ejecutar los procesos operativos de inscripción, registro y control de notas, así como brindar soporte técnico en la emisión de documentos académicos, asegurando la integridad de los datos de los estudiantes."),
    (9, 3, 6, 1, "Atender directamente las solicitudes de los estudiantes y docentes en taquilla, organizando los expedientes y archivos físicos de notas, garantizando un servicio eficiente y ordenado en el departamento."),
    (10, 4, 3, 1, "Planificar, coordinar, supervisar y evaluar las actividades administrativas de la Extensión, conducir y verificar los procedimientos administrativos vigentes así como los Registros Contables que se realizan en esta unidad, administrar las nóminas académicas y administrativas y ejecutar los pagos correspondientes a proveedores, para así lograr el buen funcionamiento administrativo de la Institución."),
    (11, 4, 8, 1, "Apoyar en la ejecución de los procesos administrativos contables, gestionando pagos de servicios, suministros y atención a requerimientos logísticos de los departamentos, asegurando el soporte necesario para la operatividad de la extensión."),
    (12, 4, 9, 2, "Garantizar la operatividad de la infraestructura física y el mobiliario de la Institución, realizando reparaciones menores y mantenimiento preventivo a las instalaciones y equipos para asegurar un ambiente funcional."),
    (13, 4, 10, 3, "Mantener en óptimas condiciones de higiene y aseo todas las áreas de la Institución, asegurando un ambiente limpio y agradable para el desarrollo de las actividades académicas y administrativas."),
    (14, 5, 3, 1, "Planificar, coordinar, supervisar, evaluar y controlar la ejecución de los programas de Pasantías y Trabajo Especial de Grado, a través del cumplimiento de los procedimientos vigentes que permitan realizar su seguimiento y evaluación."),
    (15, 5, 8, 1, "Apoyar en la gestión administrativa y logística de la Coordinación, sirviendo de enlace entre los estudiantes, tutores y la coordinación, facilitando el procesamiento de documentos y la atención a los requerimientos del proceso de pasantías."),
    (16, 6, 3, 1, "Bajo supervisión de la Jefatura de la Extensión administra en detalle las funciones relativas al área de la Coordinación de Informática, vigilando el cumplimiento de los programas establecidos y asignados a su gestión. Presta apoyo y atención al profesorado de esta área y es responsable del buen funcionamiento del Laboratorio de Informática."),
    (17, 6, 8, 1, "Coordinar y dirigir las actividades académicas de los estudiantes dentro del Laboratorio, prestando apoyo a los docentes y a la coordinación de las Carreras correspondientes, así como velar por el mantenimiento preventivo de los equipos."),
    (18, 7, 3, 1, "Bajo supervisión de la Jefatura de la Extensión, coordina y dirige las actividades y programas establecidos para el área de Educación Preescolar, orientando su cumplimiento por parte del personal docente y organizando con el alumno lo relativo a las prácticas de la especialidad."),
    (19, 7, 8, 1, "Asistir administrativamente a la Coordinación de Preescolar, apoyando en la organización de archivos, atención al público y gestión de los procesos de prácticas profesion

ales, asegurando la continuidad operativa en ausencia del Coordinador."),
    (20, 8, 3, 1, "Promover, planificar y coordinar el desarrollo de la investigación científica, las actividades de extensión cultural y deportiva, y los estudios de postgrado, vinculando a la institución con su entorno y fomentando la formación continua de la comunidad Iutirlista."),
    (21, 9, 4, 1, "Administrar, coordinar y supervisar los servicios bibliotecarios de la Institución, garantizando la organización, actualización y conservación del acervo bibliográfico, así como la prestación de un servicio eficiente a la comunidad universitaria."),
    (22, 9, 8, 1, "Atender a los estudiantes, personal docente y administrativo, para suministrarles la bibliografía que soliciten en la realización de investigaciones que favorezcan el proceso de enseñanza-aprendizaje, apoyando en la catalogación y control del material."),
    (23, 9, 11, 2, "Apoyar en las labores operativas de la biblioteca, encargándose del préstamo, devolución, ordenamiento de textos y atención primaria al usuario, contribuyendo al mantenimiento del orden y la conservación del material."),
]

for pk, dept, jt, vac, obj in positions_data:
    data.append({"model": "organization.position", "pk": pk, "fields": {"department": dept, "job_title": jt, "vacancies": vac, "objective": obj}})

print(f"Generated {len(data)} base entries (depts+jobs+positions)")

# Export to JSON
with open('organization/fixtures/initial_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved to organization/fixtures/initial_data.json ({len(data)} entries)")
print("NOTE: Requirements and Functions need to be added manually or via expanded script")
