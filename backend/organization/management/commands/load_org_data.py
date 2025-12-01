"""
Management command to load organization data from organization-manual.md
"""
import re
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from organization.models import (
    Department, JobTitle, Position, 
    PositionRequirement, PositionFunction
)


class Command(BaseCommand):
    help = 'Load organization structure from organization-manual.md'

    def handle(self, *args, **options):
        # Path to manual (relative to project root)
        manual_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'organization-manual.md'
        
        if not manual_path.exists():
            self.stdout.write(self.style.ERROR(f'Manual not found at {manual_path}'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Reading manual from {manual_path}'))
        
        # Read manual
        with open(manual_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse and load data
        with transaction.atomic():
            self._load_departments()
            self._load_jobtitles()
            self._load_positions_with_details(content)
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded organization data!'))

    def _load_departments(self):
        """Create departments with hierarchy"""
        self.stdout.write('Creating departments...')
        
        # Clear existing (careful in production!)
        Department.objects.all().delete()
        
        # Create root departments
        direccion = Department.objects.create(id=1, name="Dirección", parent=None)
        subdirección = Department.objects.create(id=2, name="Subdirección Académica", parent=direccion)
        
        # Create coordinaciones under subdirección
        Department.objects.create(id=3, name="Coordinación de Control de Estudios y Evaluación", parent=subdirección)
        Department.objects.create(id=4, name="Coordinación Administrativa", parent=direccion)
        Department.objects.create(id=5, name="Coordinación de Pasantías", parent=subdirección)
        Department.objects.create(id=6, name="Coordinación de Informática", parent=subdirección)
        Department.objects.create(id=7, name="Coordinación de Preescolar", parent=subdirección)
        Department.objects.create(id=8, name="Coordinación de Investigación, Extensión y Postgrado", parent=subdirección)
        Department.objects.create(id=9, name="Biblioteca", parent=subdirección)
        
        self.stdout.write(self.style.SUCCESS(f'  Created {Department.objects.count()} departments'))

    def _load_jobtitles(self):
        """Create simplified job titles"""
        self.stdout.write('Creating job titles...')
        
        JobTitle.objects.all().delete()
        
        titles = [
            "Director", "Subdirector", "Coordinador", "Jefe",
            "Asesor", "Secretaria", "Recepcionista", "Asistente",
            "Personal de Mantenimiento", "Personal de Limpieza", "Auxiliar"
        ]
        
        for i, title in enumerate(titles, 1):
            JobTitle.objects.create(id=i, name=title)
        
        self.stdout.write(self.style.SUCCESS(f'  Created {JobTitle.objects.count()} job titles'))

    def _load_positions_with_details(self, content):
        """Parse manual and create positions with requirements and functions"""
        self.stdout.write('Parsing manual and creating positions...')
        
        Position.objects.all().delete()
        PositionRequirement.objects.all().delete()
        PositionFunction.objects.all().delete()
        
        # Mapping from manual section titles to (department_id, jobtitle_id, vacancies, manager_id_ref)
        # manager_id_ref is the ID of the position this position reports to (or None)
        # IDs are assigned sequentially starting from 1 based on this list order.
        positions_to_create = [
            # Dirección (ID 1)
            ("Director", 1, 1, 1, None),
            # ID 2
            ("Asesor de Prensa", 1, 5, 1, 1), # Reports to Director
            # ID 3
            ("Secretaria", 1, 6, 2, 1),  # Reports to Director. Increased vacancies to 2
            # ID 4
            ("Recepcionista", 1, 7, 1, 1), # Reports to Director
            
            # Subdirección Académica (ID 5)
            ("Subdirector Académico", 2, 2, 1, 1), # Reports to Director
            # ID 6
            ("Asistente a la Subdirección Académica", 2, 8, 1, 5), # Reports to Subdirector
            
            # Control de Estudios (ID 7)
            ("Coordinador de Control de Estudios y Evaluación", 3, 3, 1, 5), # Reports to Subdirector
            # ID 8
            ("Asistente de Control de Estudios y Evaluación", 3, 8, 2, 7), # Reports to Coord. Control Estudios. Vacancies: 2
            # ID 9
            ("Secretaria", 3, 6, 1, 7),  # Reports to Coord. Control Estudios
            
            # Coordinación Administrativa (ID 10)
            ("Coordinador Administrativo", 4, 3, 1, 1), # Reports to Director (Administrative arm)
            # ID 11
            ("Asistente de la Coordinador Administrativa", 4, 8, 1, 10), # Reports to Coord. Admin
            # ID 12
            ("Personal de Mantenimiento", 4, 9, 4, 10), # Reports to Coord. Admin. Vacancies: 4
            # ID 13
            ("Personal de Limpieza", 4, 10, 5, 10), # Reports to Coord. Admin. Vacancies: 5
            
            # Pasantías (ID 14)
            ("Coordinador de Pasantías", 5, 3, 1, 5), # Reports to Subdirector
            # ID 15
            ("Asistente de la Coordinación de Pasantías", 5, 8, 1, 14), # Reports to Coord. Pasantías
            
            # Informática (ID 16)
            ("Coordinador de Informática", 6, 3, 1, 5), # Reports to Subdirector
            # ID 17
            ("Asistente del Laboratorio de Informática", 6, 8, 2, 16), # Reports to Coord. Informática. Vacancies: 2
            
            # Preescolar (ID 18)
            ("Coordinador de Preescolar", 7, 3, 1, 5), # Reports to Subdirector
            # ID 19
            ("Asistente", 7, 8, 3, 18),  # Asistente de Preescolar. Vacancies: 3
            
            # Investigación (ID 20)
            ("Coordinador de Investigación, Extensión y Post grado", 8, 3, 1, 5), # Reports to Subdirector
            
            # Biblioteca (ID 21)
            ("Jefe de Biblioteca", 9, 4, 1, 5), # Reports to Subdirector
            # ID 22
            ("Asistente de Biblioteca", 9, 8, 1, 21), # Reports to Jefe Biblioteca
            # ID 23
            ("Auxiliar de Biblioteca", 9, 11, 2, 21), # Reports to Jefe Biblioteca. Vacancies: 2
        ]
        
        # Split content by cargo sections
        cargo_pattern = r'#### Título del Cargo:(.+?)(?=#### Título del Cargo:|###|$)'
        cargos = re.findall(cargo_pattern, content, re.DOTALL)
        
        # We'll match cargos to our positions list by title
        position_counter = 1
        used_cargos = []
        
        # Store manager assignments to apply after creation
        manager_assignments = {} # position_id -> manager_id
        
        for title, dept_id, jt_id, vac, manager_id in positions_to_create:
            # Find matching cargo in manual (not yet used)
            cargo_text = None
            for i, cargo in enumerate(cargos):
                if i in used_cargos:
                    continue
                # Extract title from cargo
                lines = cargo.strip().split('\n')
                if not lines:
                    continue
                cargo_title = lines[0].strip()
                
                # Match title
                if cargo_title == title or (title == "Asistente" and "Asistente" in cargo_title and "Preescolar" in cargo):
                    cargo_text = cargo
                    used_cargos.append(i)
                    break
            
            if not cargo_text:
                self.stdout.write(self.style.WARNING(f'  Skipping: {title} (not found in manual)'))
                # Still increment counter to keep IDs consistent with our list
                position_counter += 1
                continue
            
            # Extract objective
            objective = self._extract_section(cargo_text, "**Objetivo General:**")
            
            # Extract requirements
            requirements = self._extract_list(cargo_text, "**Requisitos:**")
            
            # Extract functions
            functions = self._extract_list(cargo_text, "**Funciones:**")
            
            # Create position
            position = Position.objects.create(
                id=position_counter,
                department_id=dept_id,
                job_title_id=jt_id,
                vacancies=vac,
                objective=objective or f"Objetivo del cargo {title}"
            )
            
            # Store manager assignment
            if manager_id:
                manager_assignments[position.id] = manager_id
            
            # Create requirements
            for req in requirements:
                PositionRequirement.objects.create(
                    position=position,
                    description=req
                )
            
            # Create functions
            for i, func in enumerate(functions, 1):
                PositionFunction.objects.create(
                    position=position,
                    description=func,
                    order=i
                )
            
            self.stdout.write(f'  Created: {title} (ID: {position.id}, Vacancies: {vac})')
            position_counter += 1
            
        # Apply manager assignments
        self.stdout.write('Assigning managers...')
        for pos_id, manager_id in manager_assignments.items():
            try:
                position = Position.objects.get(id=pos_id)
                manager = Position.objects.get(id=manager_id)
                position.manager_positions.add(manager)
            except Position.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Could not assign manager {manager_id} to position {pos_id}: Position not found'))

        self.stdout.write(self.style.SUCCESS(
            f'  Created {Position.objects.count()} positions, '
            f'{PositionRequirement.objects.count()} requirements, '
            f'{PositionFunction.objects.count()} functions'
        ))

    def _extract_section(self, text, marker):
        """Extract text between marker and next **header**"""
        pattern = rf'{re.escape(marker)}\s*\n\n(.+?)(?=\n\n\*\*|$)'
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def _extract_list(self, text, marker):
        """Extract bulleted list items after marker"""
        pattern = rf'{re.escape(marker)}\s*\n\n((?:- .+\n?)+)'
        match = re.search(pattern, text)
        if match:
            items = match.group(1).strip().split('\n')
            return [item.lstrip('- ').strip() for item in items if item.strip()]
        return []
