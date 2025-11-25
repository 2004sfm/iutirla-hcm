from django.db import models
from core.models import Person

# Mensajes de error estándar
UNIQUE_ERR_MSG = {'unique': "Ya existe un registro con este nombre."}

class BusinessFunction(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        help_text="Ej: Human Resources, Finance, IT",
        error_messages=UNIQUE_ERR_MSG
    )
    description = models.TextField(blank=True, null=True)
    def __str__(self): return self.name

class EducationLevel(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        help_text="Ej: Ingeniería, Maestría, Bachillerato",
        error_messages=UNIQUE_ERR_MSG
    )
    def __str__(self): return self.name

class FieldOfStudy(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        help_text="Ej: Software, Recursos Humanos, N/A",
        error_messages=UNIQUE_ERR_MSG
    )
    def __str__(self): return self.name

# --- Modelos Transaccionales ---

class PersonSpecialAssignment(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='special_assignments')
    project_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.project_name

class PersonFunctionalExperience(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='functional_experiences')
    function = models.ForeignKey(BusinessFunction, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="NULL si es actual")
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return f"{self.person} - {self.function}"

class PersonCertification(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    institution = models.CharField(max_length=255)
    effective_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.name

class CertificationDocument(models.Model):
    certification = models.ForeignKey(PersonCertification, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='documents/certification/', blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.description or "Documento de Certificación"

class PersonEducation(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='education_history')
    school_name = models.CharField(max_length=255)
    level = models.ForeignKey(EducationLevel, on_delete=models.SET_NULL, null=True)
    field_of_study = models.ForeignKey(FieldOfStudy, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return f"{self.school_name} - {self.level}"

class PersonVolunteerExperience(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='volunteer_experiences')
    organization_name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return f"{self.organization_name} ({self.role})"

class PersonAward(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='awards')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    institution = models.CharField(max_length=255, blank=True, null=True)
    issue_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.name

class PersonMembership(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='memberships')
    organization_name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.organization_name

class Language(models.Model):
    name = models.CharField(max_length=100, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class LanguageProficiency(models.Model):
    name = models.CharField(max_length=50, unique=True, error_messages=UNIQUE_ERR_MSG)
    def __str__(self): return self.name

class PersonLanguage(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="languages")
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    speaking_proficiency = models.ForeignKey(LanguageProficiency, on_delete=models.SET_NULL, null=True, blank=True, related_name="speaking")
    reading_proficiency = models.ForeignKey(LanguageProficiency, on_delete=models.SET_NULL, null=True, blank=True, related_name="reading")
    writing_proficiency = models.ForeignKey(LanguageProficiency, on_delete=models.SET_NULL, null=True, blank=True, related_name="writing")