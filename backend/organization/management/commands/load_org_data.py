from django.core.management.base import BaseCommand
from organization.models import Department, JobTitle, Position, PositionFunction


class Command(BaseCommand):
    help = 'Carga datos organizacionales completos basados en el manual de organización'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Iniciando carga completa de datos organizacionales...'))

        # Limpiar funciones existentes para evitar duplicados
        self.stdout.write('🧹 Limpiando funciones existentes...')
        PositionFunction.objects.all().delete()

        # Crear departamentos
        departments = self.create_departments()
        
        # Crear job titles
        job_titles = self.create_job_titles()
        
        # Crear posiciones con sus jefes
        positions = self.create_positions(departments, job_titles)
        
        # Asignar reportes matriciales
        self.assign_matrix_reporting(positions)
        
        # Crear TODAS las funciones
        self.create_all_functions(positions)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Carga completada'))
        self.stdout.write(f'   - {len(departments)} Departamentos')
        self.stdout.write(f'   - {len(job_titles)} Job Titles')
        self.stdout.write(f'   - {len(positions)} Posiciones')
        
        total_functions = PositionFunction.objects.count()
        self.stdout.write(f'   - {total_functions} Funciones cargadas')

    def create_departments(self):
        self.stdout.write('📁 Creando departamentos...')
        departments = {}
        
        # Departamento raíz
        departments['direccion'] = Department.objects.get_or_create(
            name='Dirección',
            defaults={'parent': None}
        )[0]
        
        # Subdirección
        departments['subdireccion'] = Department.objects.get_or_create(
            name='Subdirección Académica',
            defaults={'parent': departments['direccion']}
        )[0]
        
        # Coordinaciones
        dept_list = [
            'Control de Estudios y Evaluación',
            'Coordinación Administrativa',
            'Coordinación de Pasantías',
            'Coordinación de Informática',
            'Coordinación de Preescolar',
            'Coordinación de Investigación, Extensión y Postgrado',
            'Biblioteca'
        ]
        
        for name in dept_list:
            key = name.lower().replace(' ', '_').replace(',', '')
            departments[key] = Department.objects.get_or_create(
                name=name,
                defaults={'parent': departments['direccion']}
            )[0]
        
        return departments

    def create_job_titles(self):
        self.stdout.write('💼 Creando job titles...')
        job_titles = {}
        
        titles = [
            'Director',
            'Subdirector Académico',
            'Coordinador',
            'Secretaria',
            'Recepcionista',
            'Asesor de Prensa',
            'Jefe de Biblioteca',
            'Auxiliar de Biblioteca',
            'Asistente de Biblioteca',
            'Personal de Mantenimiento',
            'Personal de Limpieza',
            'Asistente',
        ]
        
        for title in titles:
            key = title.lower().replace(' ', '_')
            job_titles[key] = JobTitle.objects.get_or_create(name=title)[0]
        
        return job_titles

    def create_positions(self, departments, job_titles):
        self.stdout.write('👔 Creando posiciones...')
        positions = {}
        
        # Director
        positions['director'] = Position.objects.get_or_create(
            department=departments['direccion'],
            job_title=job_titles['director'],
            defaults={'vacancies': 1}
        )[0]
        
        # Subdirector Académico
        positions['subdirector'] = Position.objects.get_or_create(
            department=departments['subdireccion'],
            job_title=job_titles['subdirector_académico'],
            defaults={'vacancies': 1}
        )[0]
        
        # Personal de Dirección
        positions['secretaria_direccion'] = Position.objects.get_or_create(
            department=departments['direccion'],
            job_title=job_titles['secretaria'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['recepcionista'] = Position.objects.get_or_create(
            department=departments['direccion'],
            job_title=job_titles['recepcionista'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asesor_prensa'] = Position.objects.get_or_create(
            department=departments['direccion'],
            job_title=job_titles['asesor_de_prensa'],
            defaults={'vacancies': 1}
        )[0]
        
        # Asistente de Subdirección
        positions['asistente_subdireccion'] = Position.objects.get_or_create(
            department=departments['subdireccion'],
            job_title=job_titles['asistente'],
            defaults={'vacancies': 1}
        )[0]
        
        # Control de Estudios
        positions['coordinador_control_estudios'] = Position.objects.get_or_create(
            department=departments['control_de_estudios_y_evaluación'],
            job_title=job_titles['coordinador'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asistente_control_estudios'] = Position.objects.get_or_create(
            department=departments['control_de_estudios_y_evaluación'],
            job_title=job_titles['asistente'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['secretaria_control_estudios'] = Position.objects.get_or_create(
            department=departments['control_de_estudios_y_evaluación'],
            job_title=job_titles['secretaria'],
            defaults={'vacancies': 1}
        )[0]
        
        # Coordinación Administrativa
        positions['coordinador_administrativo'] = Position.objects.get_or_create(
            department=departments['coordinación_administrativa'],
            job_title=job_titles['coordinador'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asistente_administrativo'] = Position.objects.get_or_create(
            department=departments['coordinación_administrativa'],
            job_title=job_titles['asistente'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['personal_mantenimiento'] = Position.objects.get_or_create(
            department=departments['coordinación_administrativa'],
            job_title=job_titles['personal_de_mantenimiento'],
            defaults={'vacancies': 2}
        )[0]
        
        positions['personal_limpieza'] = Position.objects.get_or_create(
            department=departments['coordinación_administrativa'],
            job_title=job_titles['personal_de_limpieza'],
            defaults={'vacancies': 3}
        )[0]
        
        # Coordinación de Pasantías
        positions['coordinador_pasantias'] = Position.objects.get_or_create(
            department=departments['coordinación_de_pasantías'],
            job_title=job_titles['coordinador'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asistente_pasantias'] = Position.objects.get_or_create(
            department=departments['coordinación_de_pasantías'],
            job_title=job_titles['asistente'],
            defaults={'vacancies': 1}
        )[0]
        
        # Coordinación de Informática
        positions['coordinador_informatica'] = Position.objects.get_or_create(
            department=departments['coordinación_de_informática'],
            job_title=job_titles['coordinador'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asistente_informatica'] = Position.objects.get_or_create(
            department=departments['coordinación_de_informática'],
            job_title=job_titles['asistente'],
            defaults={'vacancies': 1}
        )[0]
        
        # Coordinación de Preescolar
        positions['coordinador_preescolar'] = Position.objects.get_or_create(
            department=departments['coordinación_de_preescolar'],
            job_title=job_titles['coordinador'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asistente_preescolar'] = Position.objects.get_or_create(
            department=departments['coordinación_de_preescolar'],
            job_title=job_titles['asistente'],
            defaults={'vacancies': 1}
        )[0]
        
        # Coordinación de Investigación
        positions['coordinador_investigacion'] = Position.objects.get_or_create(
            department=departments['coordinación_de_investigación_extensión_y_postgrado'],
            job_title=job_titles['coordinador'],
            defaults={'vacancies': 1}
        )[0]
        
        # Biblioteca
        positions['jefe_biblioteca'] = Position.objects.get_or_create(
            department=departments['biblioteca'],
            job_title=job_titles['jefe_de_biblioteca'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['asistente_biblioteca'] = Position.objects.get_or_create(
            department=departments['biblioteca'],
            job_title=job_titles['asistente_de_biblioteca'],
            defaults={'vacancies': 1}
        )[0]
        
        positions['auxiliar_biblioteca'] = Position.objects.get_or_create(
            department=departments['biblioteca'],
            job_title=job_titles['auxiliar_de_biblioteca'],
            defaults={'vacancies': 2}
        )[0]
        
        return positions

    def assign_matrix_reporting(self, positions):
        self.stdout.write('🔗 Asignando reportes matriciales...')
        
        # Subdirector reporta a Director
        positions['subdirector'].manager_positions.add(positions['director'])
        
        # Personal de Dirección reporta a Director
        for key in ['secretaria_direccion', 'recepcionista', 'asesor_prensa']:
            if key in positions:
                positions[key].manager_positions.add(positions['director'])
        
        # Asistente de Subdirección reporta a Subdirector
        if 'asistente_subdireccion' in positions:
            positions['asistente_subdireccion'].manager_positions.add(positions['subdirector'])
        
        # Coordinadores reportan a Director Y Subdirector (matriz)
        coordinator_keys = [
            'coordinador_control_estudios', 'coordinador_administrativo', 'coordinador_pasantias',
            'coordinador_informatica', 'coordinador_preescolar', 'coordinador_investigacion'
        ]
        
        for coord_key in coordinator_keys:
            if coord_key in positions:
                positions[coord_key].manager_positions.add(
                    positions['director'],
                    positions['subdirector']
                )
        
        # Asistentes de coordinaciones reportan a sus coordinadores
        assistants = [
            ('asistente_control_estudios', 'coordinador_control_estudios'),
            ('secretaria_control_estudios', 'coordinador_control_estudios'),
            ('asistente_administrativo', 'coordinador_administrativo'),
            ('personal_mantenimiento', 'coordinador_administrativo'),
            ('personal_limpieza', 'coordinador_administrativo'),
            ('asistente_pasantias', 'coordinador_pasantias'),
            ('asistente_informatica', 'coordinador_informatica'),
            ('asistente_preescolar', 'coordinador_preescolar'),
        ]
        
        for assistant_key, manager_key in assistants:
            if assistant_key in positions and manager_key in positions:
                positions[assistant_key].manager_positions.add(positions[manager_key])
        
        # Biblioteca: Jefe reporta a Director
        if 'jefe_biblioteca' in positions:
            positions['jefe_biblioteca'].manager_positions.add(positions['director'])
        
        # Asistente y Auxiliar reportan a Jefe de Biblioteca
        for key in ['asistente_biblioteca', 'auxiliar_biblioteca']:
            if key in positions and 'jefe_biblioteca' in positions:
                positions[key].manager_positions.add(positions['jefe_biblioteca'])

    def create_all_functions(self, positions):
        self.stdout.write('📝 Creando TODAS las funciones desde el manual...')
        
        functions_data = {
            'director': [
                'Planificar, Dirigir, Coordinar y Supervisar las actividades académicas y administrativas del Instituto',
                'Formular recomendaciones ante la Directiva Nacional, tendientes a promover el desarrollo y la imagen del Instituto',
                'Programar las necesidades de Recursos Humanos, Físicos y Materiales en la consideración al crecimiento de la matrícula',
                'Cumplir y hacer cumplir todo lo concerniente al funcionamiento óptimo de la sede',
                'Convocar y Presidir al Consejo Directivo de la extensión',
                'Presentar ante la Dirección Nacional un informe semestral sobre las actividades inherentes a su cargo',
                'Imponer las sanciones correspondiente al personal Docente y Administrativo a su cargo que no se cumpla con las actividades inherentes a su cargo',
                'Velar por el cumplimiento de las disposiciones que señale la Dirección Nacional',
                'Velar por el orden y la disciplina dentro del Instituto',
                'Estudiar y Recomendar a la Dirección Nacional, las medidas que contribuyan a mejorar el funcionamiento integral del Instituto',
                'Controlar las actividades de docencia, administrativas y demás funciones del Instituto',
                'Dirigir la reunión de profesores al inicio de cada periodo académico, con el objeto de informar los lineamientos a seguir en la labor docente',
                'Cualquier otra actividad asignada por la Dirección',
            ],
            'asesor_prensa': [
                'Asesorar sobre las relaciones Institucionales que debe mantener el Iutirla',
                'Mantener relaciones con Gremios, Instituciones u Organismos Públicos y Privados',
                'Efectuar campañas publicitarias tendientes a captar nuevos estudiantes',
                'Planificar y Coordinar ruedas de Prensa, Radio y T.V.',
                'Apoyar, Promocionar y Participar activamente en los eventos organizados por la Institución',
                'Redactar las notas de prensa que requiere la Institución',
                'Cualquier otra actividad asignada por el Director',
            ],
            'secretaria_direccion': [
                'Asistir junto con el Director a todas las reuniones de carácter administrativo y docente, llevar la respectiva minuta',
                'Redactar y elaborar todas las correspondencias que emanen de la Dirección del Instituto',
                'Atender de manera rápida y eficiente a las personas en general que se dirijan a la Dirección del Instituto',
                'Revisar todas las correspondencias recibidas de los diferentes Departamentos',
                'Velar por el perfecto orden y mantenimiento de los bienes muebles que se encuentren dentro de la oficina',
                'Distribuir a los Departamentos las comunicaciones emanadas de la Dirección',
                'Tipear los informes semestrales y posteriormente enviarlo a la Dirección Nacional',
                'Atender las llamadas telefónicas realizadas desde y hacia el Instituto',
                'Llevar la agenda del Director',
                'Auxiliar a cualquier Departamento al momento que lo necesite',
                'Cualquier otra asignada por el director',
            ],
            'recepcionista': [
                'Brindar información a la comunidad estudiantil y al público en general',
                'Realizar inscripción de forma computarizada a los alumnos que ingresan a la institución',
                'Canjear recibos para solicitudes de constancias de notas, constancias de estudios, programas sellados y reingresos',
                'Atender amablemente las llamadas telefónicas y te ner un control de las mismas',
                'Entregar los carnet a los estudiantes, cursantes del primer semestre',
                'Controlar y verificar la carpeta de asistencia personal docente',
                'Entregar memorándum y/o correspondencias al personal docente',
                'Verificar la existencia de los materiales utilizados por los docentes: tizas, borradores, y hoja para evaluaciones',
                'Prestar colaboración en cualquier actividad inherente a la Institución asignada por la Dirección',
            ],
            'subdirector': [
                'Suplir las ausencias temporales del Director',
                'Apoyar y Colaborar en las funciones del Director',
                'Velar por el cumplimiento de las disposiciones y normativas para el área Académica',
                'Planificar y Someter a consideración de la Dirección la programación docente de los periodos académicos',
                'Optimizar el proceso de atención a los estudiantes, ante las quejas realizadas a fin de garantizar su solución',
                'Efectuar una relación del personal Docente que contenga el nombre del profesor, materias que dicta y/o que puede dictar',
                'Realizar una evaluación de credenciales semestralmente',
                'Elaborar un informe mensual sobre las actividades realizadas con las sugerencias respectivas',
                'Coordinar y Supervisar el proceso de asignación de los Trabajos Especiales de Grado',
                'Elaborar un listado que contenga el nombre del profesor, cédula de identidad, materia(s) que dicta, sección, número de horas',
                'Analizar las propuestas de los profesores en cuanto a los programas de estudio y carreras',
                'Coordinar el proceso de aplicación y asignación de profesores para los exámenes de suficiencia',
                'Elaborar la carga horaria semestral del personal Docente',
                'Planificar el curso de Inducción o Introductorio que se dicta a los alumnos nuevos',
                'Efectuar el proceso de Cuadre de Horarios en semestres regulares y cursos de verano',
                'Atender a estudiantes, docentes y público en general',
                'Colaborar con las Coordinaciones de Pasantías, Preescolar e Informática en las actividades extra-académicas',
                'Mantener relaciones Institucionales con las Unidades Educativas',
                'Cualquier otra actividad señalada por la Dirección del Instituto',
            ],
            'asistente_subdireccion': [
                'Mantener un archivo de elegibles por área donde se encuentren los curricula del personal docente',
                'Elaborar un archivo del personal Docente actualizado que labora en la Institución',
                'Programar y Publicar el curso Introductorio',
                'Ayudar en el proceso de cuadre de horarios semestrales y curso de verano. Publicar horarios',
                'Elaboración del material a entregar al personal Docente y convocar a las reuniones',
                'Llevar un control de asistencias e inasistencias mensual y semestral del personal Docente',
                'Revisar y Analizar la planificación de actividades semestrales entregadas por los profesores',
                'Programar charlas dirigidas a la población estudiantil de las diferentes especialidades',
                'Mantener un archivo de programas de asignaturas de las especialidades',
                'Elaborar y Actualizar las carteleras informativas para estudiantes y docentes',
                'Canalizar y Solucionar situaciones formuladas por docentes y estudiantes',
                'Elaborar Comunicaciones, Memorándum e Informes',
                'Efectuar una programación de charlas Institucionales en las Unidades Educativas Neoespartanas',
                'Notificar a la Coordinación Administrativa sobre cualquier irregularidad en las aulas',
                'Cualquier otra actividad asignada por la subdirección',
            ],
        }
        
        # Agregar funciones de coordinadores y asistentes al diccionario
        self._create_coordinator_functions(positions, functions_data)
        
        # Ahora crear TODAS las funciones en la base de datos
        for position_key, functions in functions_data.items():
            if position_key in positions:
                for order, func_desc in enumerate(functions):
                    PositionFunction.objects.create(
                        position=positions[position_key],
                        description=func_desc,
                        order=order
                    )
    
    def _create_coordinator_functions(self, positions, functions_data):
        """Agrega las funciones de todos los coordinadores y asistentes"""
        
        # Coordinador Control de Estudios
        functions_data['coordinador_control_estudios'] = [
            'Planificar, Organizar, Coordinar y Dirigir',
            'Elaborar el proceso de pre-inscripción, inscripción y reinscripción',
            'Recibir las peticiones de equivalencias que se presenten a la Institución',
            'Presentar al finalizar el período Académico un informe de trabajo',
            'Recibir y Tramitar solicitudes de retiro de materias, inclusión de asignaturas y rectificación de inscripción',
            'Comunicar a los estudiantes acerca de problemas en documentos necesarios para la tramitación del título',
            'Programar la distribución de aulas en función de la matricula estudiantil',
            'Supervisar la entrega de los listados de notas a los profesores',
            'Programar, Registrar, Procesar y Controlar estadísticamente la evaluación del rendimiento estudiantil',
            'Canalizar e Instrumentar mecanismos adecuados para el registro, retiro, cambio de sede, reingreso y cambio de carrera',
            'Preparar el material de información Académica que debe ser suministrado a los estudiantes',
            'Coordinar con la Dirección y la Coordinación Académica la programación de los actos de grado',
            'Detectar los alumnos que obtengan Índice Académico de Nueve (9) y ocho (8) puntos para el otorgamiento de menciones',
            'Las demás que sean señaladas por la Dirección y/o la Subdirección Académica',
        ]
        
        # Asistente Control de Estudios
        functions_data['asistente_control_estudios'] = [
            'Respaldar y Tener actualizados los archivos que forman parte del proceso de la unidad',
            'Crear programas que mejoren el funcionamiento computarizado del Departamento',
            'Preparar todo lo relacionado con los procesos de inscripción',
            'Proporcionar oportunamente los listados de alumnos inscritos',
            'Procesar y Expedir constancias a los alumnos que lo soliciten',
            'Recibir y tramitar solicitudes de cambio de carrera, reincorporación, retiros',
            'Elaborar conjuntamente con el Jefe de Control de Estudios las estadísticas solicitadas',
            'Las demás que sean asignadas por el Jefe de Control de Estudios',
        ]
        
        # Secretaria Control de Estudios
        functions_data['secretaria_control_estudios'] = [
            'Recibir todas las solicitudes que se presentan al Departamento',
            'Llevar un control de los Récords de notas de los alumnos',
            'Revisar los expedientes de los alumnos próximo a graduarse',
            'Llevar el control de las encuestas para los cursos de Avance y Recuperación',
            'Elaborar las carteleras informativas del Departamento',
            'Brindar información, Atender, Canalizar y/o Solucionar las quejas de los alumnos',
            'Entregar constancias de estudios, de notas, de culminación y programas solicitados',
            'Realizar Cartas, Memorándum e Informes',
            'Entregar y recibir los listados de calificaciones',
            'Las demás que sean señaladas por el Jefe de Control de Estudios',
        ]
        
        # Coordinador Administrativo
        functions_data['coordinador_administrativo'] = [
            'Planificar, Organizar, Coordinar y Dirigir el sistema de suministro de material',
            'Elaborar la nómina del personal Administrativo y Docente',
            'Calcular el descuento de Ley de Política Habitacional, S.S.O., I.S.R.L., Cooperativa de Ahorro',
            'Cotizar y comprar los materiales de oficina, limpieza, y otros',
            'Supervisar y darles el respectivo mantener a las instalaciones físicas, equipos y mobiliarios',
            'Elaborar y Enviar la Contabilidad a la Administración Nacional',
            'Realizar la relación mensual de Ingresos y Egresos',
            'Elaborar quincenalmente la relación de gastos',
            'Supervisar las tareas realizadas por el personal de mantenimiento y limpieza',
            'Enviar al banco una relación quincenal al personal Administrativo y mensual al personal Docente',
            'Solicitar el material impreso a la Administración Central',
            'Cualquier otra actividad asignada por la Dirección y/o Subdirección Académica',
        ]
        
        # Asistente Administrativo
        functions_data['asistente_administrativo'] = [
            'Elaborar y entregar cheques de descuentos de I.S.L.R., convenios Institucionales, S.S.O.',
            'Recibir, Revisar y Pagar los servicios Básicos',
            'Supervisar la cisterna de agua',
            'Suministrar los efectos de oficina, papelería y equipos necesarios',
            'Reproducir los Exámenes y cualquier otro material',
            'Atender al público en general y a las necesidades formuladas por los Docente y estudiantes',
            'Recibir las facturas a descontar por nómina del personal Administrativo',
            'Inventariar el material existente de oficina y de limpieza',
            'Cualquier otra actividad señalada por el Coordinador Administrativo',
        ]
        
        # Personal de Mantenimiento
        functions_data['personal_mantenimiento'] = [
            'Supervisar y mantener el tanque de agua en óptimas condiciones',
            'Ordenar el depósito de materiales y suministros',
            'Notificar las deficiencias y estado de materiales y herramientas',
            'Supervisar los aires acondicionados, notificando cualquier irregularidad',
            'Reproducir los exámenes y fotocopiar cualquier material',
            'Reparar los pupitres y cátedras de las aulas',
            'Revisar tuberías e instalaciones eléctricas',
            'Pintar las áreas internas y externas',
            'Limpiar y mantener las áreas verdes',
            'Cualquier otra actividad señalada por la Coordinación Administrativa',
        ]
        
        # Personal de Limpieza
        functions_data['personal_limpieza'] = [
            'Mantener en óptimo estado los pisos de la Institución',
            'Regar y mantener en perfecto estado las áreas verdes',
            'Notificar cualquier irregularidad: avería en tuberías, pupitres dañados, sistema electrónico',
            'Notificar sobre el estado de las herramientas necesarias para las labores',
            'Sugerir la adquisición de materiales y utensilios para realizar la labor de limpieza',
            'Cualquier otra actividad sugerida por la Coordinación Administrativa',
        ]
        
        # Coordinador de Pasantías
        functions_data['coordinador_pasantias'] = [
            'Planificar, coordinar, supervisar y evaluar la ejecución del programa de Pasantías',
            'Establecer las normas, procedimientos y sistemas que permitan realizar el seguimiento y evaluación',
            'Rendir información periódicamente a la Dirección sobre el cumplimiento y desarrollo de Pasantías',
            'Organizar actividades de inducción para los Pasantes',
            'Elaborar los horarios de Asesorías y designar a los Tutores Académicos',
            'Cumplir y hacer cumplir el Reglamento de Pasantías, Trabajo Complementario y Trabajo Especial de Grado',
            'Enviar una relación de las inasistencias de los Tutores Académicos',
            'Supervisar y realizar reuniones periódicas con los Tutores Académicos',
            'Realizar reuniones periódicas con los Pasantes',
            'Supervisar la actuación de los Pasantes en las empresas',
            'Fungir de enlace con los centros de Trabajo para determinar las características del mercado ocupacional',
            'Proponer normas procedimientos y métodos que tiendan al mejoramiento de la actividad de Pasantías',
            'Planificar, coordinar, supervisar y evaluar el desarrollo de los Trabajo complementarios',
            'Coordinar el desarrollo de los Trabajos Especiales de Grado',
            'Enviar a la Biblioteca los Informes que hayan obtenido la mención de publicar',
            'Designar los Jurados de las Exposiciones Finales',
            'Asistir a las reuniones convocadas por la Dirección',
            'Efectuar un plan de seguimiento y control de Técnicos Superiores Universitarios egresados',
            'Cualquier otra actividad señaladas por la Dirección o la Subdirección Académica',
        ]
        
        # Asistente de Pasantías
        functions_data['asistente_pasantias'] = [
            'Suplir las ausencias Temporales al Coordinador de Pasantías',
            'Formular sugerencias tendientes a mejorar el desarrollo de la actividad de Pasantía',
            'Elaborar y enviar mensualmente a la Coordinación Administrativa, las modificaciones de carga horaria',
            'Supervisar a los Tutores académicos durante las Asesorías',
            'Atender a los Pasantes y Tutores Académicos con el fin de canalizar sus reclamos',
            'Dar solución a cualquier inconveniente presentado en la actividad de Pasantía',
            'Asistir al Coordinador en la elaboración de Calendarios de Exposiciones finales',
            'Las demás actividades que sean indicadas por el Coordinador de Pasantías',
        ]
        
        # Coordinador de Informática
        functions_data['coordinador_informatica'] = [
            'Planificar las actividades académicas de los profesores del área de Informática',
            'Supervisar periódicamente las actividades desarrolladas por cada profesor',
            'Programar y Coordinar actividades extra-cátedras: charlas, conferencias y exposiciones',
            'Coordinar y Encausar lo referente al material bibliográfico actualizado',
            'Asistir a las reuniones del Consejo Académico',
            'Asignar los Trabajos Extraordinarios conjuntamente con la Coordinación de Pasantías',
            'Supervisar pasantes del área, asesores de Pasantías, Trabajo Extraordinario y Trabajo Especial',
            'Constatar que los profesores del área cumplan con el horario de clase establecido',
            'Realizar reuniones periódicas con los profesores del área',
            'Mantener informado a los profesores sobre los objetivos y estrategias para el proceso Enseñanza-Aprendizaje',
            'Supervisar las instalaciones del Laboratorio de Informática',
            'Apoyar y Colaborar en el proceso de cuadre de horarios',
            'Cualquier otra actividad señalada por la Dirección o la Subdirección Académica',
        ]
        
        # Asistente Informática
        functions_data['asistente_informatica'] = [
            'Mantener en óptimas condiciones las computadoras del Laboratorio',
            'Supervisar y Mantener la Red Novell Netware en perfectas Condiciones',
            'Sugerir actualizaciones en cuanto a programas de aplicación más avanzados',
            'Prestar ayuda al alumnado en alguna dificultad en el proceso aprendizaje',
            'Velar por el buen funcionamiento de los Sistemas de Cuadre de Horarios y Biblioteca',
            'Supervisar el uso de los equipos y controlar la ubicación de los alumnos en el Laboratorio',
            'Elaborar y proponer nuevos programas destinados a maximizar la eficiencia',
            'Velar por el buen funcionamiento de las computadoras del resto de las dependencias',
            'Mantener el archivo ordenado',
            'Actualizar la cartelera de Informática',
            'Velar por el stock de marcadores, tarjetas de videos, borradores',
            'Cumplir y hacer cumplir el Reglamento Interno del Laboratorio',
            'Mantener el orden y la disciplina en las áreas del Laboratorio',
            'Cualquier otra actividad indicada por el Coordinador de Informática',
        ]
        
        # Coordinador de Preescolar
        functions_data['coordinador_preescolar'] = [
            'Coordinar actividades Técnico-Docente y Técnico-Administrativa del diseño curricular',
            'Colaborar con la Subdirección Académica en la elaboración de Horarios',
            'Supervisar el control de asistencia del personal Docente de Preescolar',
            'Participar en el proceso de pre-inscripción, inscripción',
            'Realizar reuniones con los Docentes a fin de unificar criterios',
            'Mantener informados a la Dirección y Subdirección sobre las actividades del área',
            'Velar por el orden y disciplina, atender a los alumnos',
            'Planificar y preparar el plan de actividades de Prácticas Profesionales',
            'Solicitar a los Profesores la revisión de los programas y bibliografía',
            'Establecer vínculos Interinstitucionales con los entes educativos',
            'Proponer personal Docente calificado del área',
            'Planificar y Coordinar la estructura de las Prácticas Profesionales IV',
            'Apoyar los planes de actividades extra-académicos',
            'Entregar un plan semestral de actividades',
            'Cualquier otra actividad señalada por la Dirección y la Subdirección Académica',
        ]
        
        # Asistente Preescolar
        functions_data['asistente_preescolar'] = [
            'Suplir las ausencias temporales del Coordinador de Preescolar',
            'Brindar atención e información a los estudiantes, docentes y público en general',
            'Organizar y Mantener en orden y al día el archivo de la Coordinación',
            'Transcribir los informes, documentos, cartas, memos y otros',
            'Recibir y enviar las correspondencias entre instituciones',
            'Publicar y Actualizar avisos informativos en la cartelera',
            'Solicitar e inventariar material de oficina',
            'Apoyar la gestión y administración de Prácticas Profesionales',
            'Atender las llamadas telefónicas',
            'Brindar apoyo a las instalaciones que así lo requieran en la Institución',
        ]
        
        # Coordinador de Investigación
        functions_data['coordinador_investigacion'] = [
            'Planificar y Coordinar la formación integral de la comunidad Iutirlista',
            'Mantener contactos con gremios, Unidades Educativas, Universidades',
            'Proponer la realización de cursos de Post-grado en áreas de interés',
            'Elaborar una evaluación de credenciales del personal docente',
            'Propiciar jornadas internas, regionales y nacionales en áreas de Investigación',
            'Supervisar y Coordinar la realización de torneos deportivos, actos sociales, culturales',
            'Planificar, Coordinar y Supervisar la presentación de conferencistas',
            'Promover y Consolidar programas de captación estudiantil y desarrollo socio-cultural',
            'Planificar y Coordinar las actividades para la realización de los actos de grado',
            'Mantener y Apoyar a la Cantoría Universitaria del Iutirla, grupo de protocolo, equipos deportivos',
            'Apoyar la realización de diferentes eventos organizados por las cátedras',
            'Preparar un plan semestral de las actividades de su competencia',
            'Supervisar y Coordinar cualquier otra actividad aprobada en instancias superiores',
        ]
        
        # Jefe de Biblioteca
        functions_data['jefe_biblioteca'] = [
            'Planificar y Coordinar el proceso de alcance de textos que faciliten el aprendizaje',
            'Supervisar el sistema computarizado de biblioteca',
            'Notificar a la Coordinación de Informática del mantenimiento, reparación y mejora del sistema',
            'Planificar y supervisar el proceso de préstamo de libros',
            'Mantener y controlar las existencias de textos en Biblioteca',
            'Controlar y verificar diariamente los morosos con Biblioteca',
            'Mantener al día las carteleras dependientes de Biblioteca',
            'Recopilar artículos en la prensa diaria local y nacional (Hemeroteca)',
            'Coordinar con el departamento de administración el encuadernado de textos',
            'Efectuar una relación de textos por los Docentes y Estudiantes',
            'Dar entrada al Sistema Computarizado de los libros nuevos y/o donados',
            'Canalizar la creación de nuevos módulos para que el Usuario obtenga mayores beneficios',
            'Mantener un inventario de textos actualizados',
            'Velar porque se cumplan las normas establecidas en Biblioteca',
            'Velar por la aplicación correcta de los reglamentos internos de Biblioteca',
            'Cumplir otras asignaciones cónsonas con el cargo',
        ]
        
        # Asistente de Biblioteca
        functions_data['asistente_biblioteca'] = [
            'Suplir al jefe de Biblioteca en casos de ausencia temporal',
            'Optimizar la atención a los usuarios',
            'Orientar al usuario en la búsqueda del tema en el Sistema Computarizado',
            'Sugerir ideas al Jefe de Biblioteca para un mejor desenvolvimiento de usuarios',
            'Elaborar conjuntamente con los auxiliares el inventario de Biblioteca',
            'Mantener informado al Jefe de Biblioteca sobre los acontecimientos',
            'Realizar actividades de acuerdo a su cargo que realcen la imagen de la Institución',
            'Atender y Orientar las consultas del público interno y externo',
            'Mantener el orden y disciplina en el área de la Biblioteca y de la Institución',
        ]
        
        # Auxiliar de Biblioteca
        functions_data['auxiliar_biblioteca'] = [
            'Optimizar la atención a los usuarios',
            'Recibir y dar préstamos de textos, folletos, publicaciones existentes',
            'Dar mantenimiento a los textos',
            'Ayudar a la realización del inventario de Biblioteca',
            'Informar al Jefe de Biblioteca o al Asistente de alguna discrepancia',
            'Atender y Orientar las consultas del público interno y externo sobre el material existente',
            'Mantener el orden y disciplina en el área de Biblioteca',
            'Realiza cualquier otra actividad, que le sea asignada para beneficio de la Institución',
        ]
