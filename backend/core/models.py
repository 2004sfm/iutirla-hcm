from django.db import models

# Configuración base para mensajes de error
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}
ISO_UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este código ISO."}
CODE_UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este código."}
EMAIL_UNIQUE_ERR_MSG = {'unique': "Este correo electrónico ya está registrado."}

# --- CATÁLOGOS BÁSICOS ---
class Salutation(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class Gender(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class MaritalStatus(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True, error_messages=UNIQUE_ERR_MSG)
    iso_2 = models.CharField(max_length=2, help_text="Ej: US, VE.", unique=True, error_messages=ISO_UNIQUE_ERR_MSG)
    phone_prefix = models.CharField(max_length=10, help_text="Prefijo telefónico (ej: +58).", unique=True, error_messages={'unique': "Ya existe un país con este prefijo."})
    def __str__(self): return self.name

class DisabilityGroup(models.Model):
    name = models.CharField(max_length=100, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class DisabilityType(models.Model):
    name = models.CharField(max_length=100, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class DisabilityStatus(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class AddressType(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class EmailType(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class PhoneType(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class PhoneCarrier(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class Bank(models.Model):
    name = models.CharField(max_length=100, unique=True, error_messages=UNIQUE_ERR_MSG)
    code = models.CharField(max_length=4, unique=True, error_messages=CODE_UNIQUE_ERR_MSG)
    def __str__(self): return f"{self.name} ({self.code})"

class BankAccountType(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class RelationshipType(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

# --- MODELOS RELACIONALES ---

class State(models.Model):
    name = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    class Meta: unique_together = ('country', 'name')
    def __str__(self): return f"{self.name}, {self.country.name}"

class PhoneAreaCode(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    carrier = models.ForeignKey(PhoneCarrier, on_delete=models.SET_NULL, null=True, blank=True)
    code = models.CharField(max_length=5)
    type = models.CharField(max_length=20)
    class Meta: unique_together = ('country', 'code', 'carrier')
    def __str__(self): return f"{self.code} ({self.carrier or self.type})"

class Person(models.Model):
    first_name = models.CharField(max_length=100)
    second_name = models.CharField(max_length=100, blank=True, null=True)
    paternal_surname = models.CharField(max_length=100)
    maternal_surname = models.CharField(max_length=100, blank=True, null=True)
    salutation = models.ForeignKey(Salutation, on_delete=models.SET_NULL, null=True, blank=True)
    gender = models.ForeignKey(Gender, on_delete=models.SET_NULL, null=True, blank=True)
    marital_status = models.ForeignKey(MaritalStatus, on_delete=models.SET_NULL, null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    country_of_birth = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True)
    photo = models.ImageField(upload_to='photos/person/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.first_name} {self.paternal_surname}"

# --- IDENTIFICACIÓN VENEZOLANA ROBUSTA ---
class NationalId(models.Model):
    # ... (campos igual que antes) ...
    CATEGORY_CHOICES = [
        ('CEDULA', 'Cédula de Identidad'),
        ('RIF', 'RIF'),
        ('PASSPORT', 'Pasaporte'),
    ]

    PREFIX_CHOICES = [
        ('V', 'V - Venezolano / Persona Natural'),
        ('E', 'E - Extranjero / Persona Natural'),
        ('J', 'J - Jurídico'),
        ('G', 'G - Gubernamental'),
        ('P', 'P - Pasaporte'),
    ]

    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="national_ids")
    
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='CEDULA')
    document_type = models.CharField(max_length=1, choices=PREFIX_CHOICES, default='V', verbose_name="Prefijo")
    number = models.CharField(max_length=20, help_text="Solo números.")
    
    is_primary = models.BooleanField(default=False)
    file = models.FileField(upload_to='documents/national_id/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [
            # REGLA 1: Nadie más puede tener este documento en el sistema
            ('document_type', 'number'),
            
            # REGLA 2: Esta persona solo puede tener UNO de cada categoría
            ('person', 'category'),
        ]

    def __str__(self):
        return f"{self.get_category_display()}: {self.document_type}-{self.number}"

# --- DETALLES DE PERSONA ---

class PersonDisabilityVE(models.Model):
    person = models.OneToOneField(Person, on_delete=models.CASCADE, primary_key=True)
    date_learned = models.DateField(null=True, blank=True)
    disability_group = models.ForeignKey(DisabilityGroup, on_delete=models.SET_NULL, null=True, blank=True)
    disability_degree = models.CharField(max_length=50, blank=True, null=True)
    disability_type = models.ForeignKey(DisabilityType, on_delete=models.SET_NULL, null=True, blank=True)
    issuing_authority = models.CharField(max_length=100, blank=True, null=True)
    reference_number = models.CharField(max_length=50, blank=True, null=True)
    disability_status = models.ForeignKey(DisabilityStatus, on_delete=models.SET_NULL, null=True, blank=True)
    date_of_determination = models.DateField(null=True, blank=True)

class Address(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="addresses")
    address_type = models.ForeignKey(AddressType, on_delete=models.SET_NULL, null=True)
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    street_name_and_number = models.CharField(max_length=255)
    extra_address_line = models.CharField(max_length=255, blank=True, null=True)
    house_number = models.CharField(max_length=50, blank=True, null=True)
    apartment = models.CharField(max_length=50, blank=True, null=True)
    street_2 = models.CharField(max_length=255, blank=True, null=True)

class PersonEmail(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="emails")
    email_type = models.ForeignKey(EmailType, on_delete=models.SET_NULL, null=True)
    email_address = models.EmailField(unique=True, error_messages=EMAIL_UNIQUE_ERR_MSG) 
    is_primary = models.BooleanField(default=False)
    
    def __str__(self): 
        return self.email_address

class PersonPhone(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="phones")
    phone_type = models.ForeignKey(PhoneType, on_delete=models.SET_NULL, null=True)
    area_code = models.ForeignKey(PhoneAreaCode, on_delete=models.SET_NULL, null=True)
    subscriber_number = models.CharField(max_length=10)
    is_primary = models.BooleanField(default=False)
    
    def __str__(self): return f"({self.area_code.code}) {self.subscriber_number}"
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['area_code', 'subscriber_number'],
                name="phone_unique",
                violation_error_message="Este número de teléfono ya se encuentra registrado.",
            ),
            models.UniqueConstraint(
                fields=['person'],
                condition=models.Q(is_primary=True),
                name='one_primary_phone_per_person',
                violation_error_message="La persona ya tiene un teléfono principal registrado.",
            ),
        ]

class PersonBankAccount(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="bank_accounts")
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, null=True)
    bank_account_type = models.ForeignKey(BankAccountType, on_delete=models.SET_NULL, null=True)
    account_number = models.CharField(max_length=20, unique=True, error_messages={'unique': "Este número de cuenta ya está registrado."})
    is_primary = models.BooleanField(default=False)

class PersonDocument(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="documents")
    file = models.FileField(upload_to='documents/person/', blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)

class PersonNationality(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="nationalities")
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    class Meta: unique_together = ('person', 'country')

# --- SATÉLITES ---
class Dependent(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="dependents")
    first_name = models.CharField(max_length=100)
    second_name = models.CharField(max_length=100, blank=True, null=True)
    paternal_surname = models.CharField(max_length=100)
    maternal_surname = models.CharField(max_length=100, blank=True, null=True)
    relationship = models.ForeignKey(RelationshipType, on_delete=models.SET_NULL, null=True)
    birthdate = models.DateField()
    gender = models.ForeignKey(Gender, on_delete=models.SET_NULL, null=True, blank=True)
    class Meta: unique_together = ('person', 'first_name', 'paternal_surname')

class EmergencyContact(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="emergency_contacts")
    first_name = models.CharField(max_length=100)
    second_name = models.CharField(max_length=100, blank=True, null=True)
    paternal_surname = models.CharField(max_length=100)
    maternal_surname = models.CharField(max_length=100, blank=True, null=True)
    relationship = models.ForeignKey(RelationshipType, on_delete=models.SET_NULL, null=True)
    phone_area_code = models.ForeignKey(PhoneAreaCode, on_delete=models.SET_NULL, null=True)
    phone_number = models.CharField(max_length=10)
    is_primary = models.BooleanField(default=False)