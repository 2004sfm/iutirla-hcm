import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import (
    Person, Gender, MaritalStatus, Country, AddressType, NationalId, 
    PhoneType, PhoneCarrier, EmailType, Address, State
)
from employment.models import (
    Employment, Position, RoleChoices, EmploymentTypeChoices, 
    EmploymentStatusChoices
)
from organization.models import Department, JobTitle

User = get_user_model()

class Command(BaseCommand):
    help = 'Generates 10 fictitious employees with accounts and data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Generating test data...')

        # --- DATA POOLS ---
        first_names = ['Juan', 'Maria', 'Pedro', 'Ana', 'Luis', 'Carmen', 'Jose', 'Laura', 'Miguel', 'Elena', 'Carlos', 'Sofia']
        last_names = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres']
        streets = ['Av. Bolivar', 'Calle Principal', 'Av. Miranda', 'Calle Sucre', 'Av. Libertador']
        cities = ['Caracas', 'Valencia', 'Maracaibo', 'Barquisimeto', 'Maracay']

        # --- GET OR CREATE CATALOGS ---
        gender_m, _ = Gender.objects.get_or_create(name='Masculino')
        gender_f, _ = Gender.objects.get_or_create(name='Femenino')
        single, _ = MaritalStatus.objects.get_or_create(name='Soltero(a)')
        country_ve, _ = Country.objects.get_or_create(name='Venezuela', defaults={'iso_2': 'VE'})
        addr_type, _ = AddressType.objects.get_or_create(name='Residencial')
        
        # --- ENSURE POSITIONS EXIST ---
        positions = list(Position.objects.all())
        if not positions:
            self.stdout.write('No positions found. Creating dummy positions...')
            dept, _ = Department.objects.get_or_create(name='Recursos Humanos', defaults={'code': 'RRHH'})
            job, _ = JobTitle.objects.get_or_create(name='Analista', defaults={'level': 'L1'})
            pos = Position.objects.create(
                department=dept,
                job_title=job,
                is_managerial=False,
                vacancies=20
            )
            positions.append(pos)

        # --- GENERATE 10 PEOPLE ---
        for i in range(10):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            gender = gender_m if first_name in ['Juan', 'Pedro', 'Luis', 'Jose', 'Miguel', 'Carlos'] else gender_f
            
            # 1. Create Person
            person = Person.objects.create(
                first_name=first_name,
                paternal_surname=last_name,
                gender=gender,
                marital_status=single,
                birthdate=date(1980 + random.randint(0, 20), random.randint(1, 12), random.randint(1, 28)),
                country_of_birth=country_ve
            )

            # 2. National ID
            cedula = random.randint(10000000, 30000000)
            NationalId.objects.create(
                person=person,
                document_type='V',
                number=str(cedula),
                is_primary=True
            )

            # 3. User Account
            username = f"{first_name[0].lower()}{last_name.lower()}{random.randint(10, 99)}"
            # Ensure unique username
            while User.objects.filter(username=username).exists():
                username = f"{first_name[0].lower()}{last_name.lower()}{random.randint(100, 999)}"
            
            user = User.objects.create_user(username=username, password='password123')
            person.user_account = user
            person.save()

            # 4. Address
            state_dc, _ = State.objects.get_or_create(name='Distrito Capital', country=country_ve)
            from core.models import Address
            
            Address.objects.create(
                person=person,
                address_type=addr_type,
                country=country_ve,
                state=state_dc,
                city=random.choice(cities),
                street_name_and_number=f"{random.choice(streets)} #{random.randint(1, 100)}",
                postal_code=f"10{random.randint(10, 99)}"
            )
            
            # 5. Employment
            pos = random.choice(positions)
            Employment.objects.create(
                person=person,
                position=pos,
                role=RoleChoices.EMPLOYEE,
                employment_type=EmploymentTypeChoices.PERMANENT,
                current_status=EmploymentStatusChoices.ACTIVE,
                hire_date=date(2023, 1, 1)
            )

            self.stdout.write(f'Created: {person} ({username}) - {pos}')

        self.stdout.write(self.style.SUCCESS('Successfully generated 10 test employees'))
