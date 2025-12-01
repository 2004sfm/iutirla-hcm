from django.contrib import admin
from . import models

# Register your models here.
# --- Catálogos ---
admin.site.register(models.Gender)
admin.site.register(models.MaritalStatus)
admin.site.register(models.Country)
admin.site.register(models.State)

# --- Discapacidad ---
admin.site.register(models.DisabilityGroup)
admin.site.register(models.DisabilityType)
admin.site.register(models.DisabilityStatus)

# --- Contacto y Bancos ---
admin.site.register(models.AddressType)
admin.site.register(models.EmailType)
admin.site.register(models.PhoneType)
admin.site.register(models.PhoneCarrier)
admin.site.register(models.PhoneCarrierCode)
admin.site.register(models.Bank)
admin.site.register(models.BankAccountType)
admin.site.register(models.RelationshipType)

# --- PERSONA Y DETALLES ---

class NationalIdInline(admin.TabularInline):
    model = models.NationalId
    extra = 0

class DependentInline(admin.TabularInline):
    model = models.Dependent
    extra = 0

class EmergencyContactInline(admin.TabularInline):
    model = models.EmergencyContact
    extra = 0

@admin.register(models.Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'paternal_surname', 'birthdate', 'gender')
    search_fields = ('first_name', 'paternal_surname')
    # Agregamos inlines para ver todo junto en el admin
    inlines = [NationalIdInline, DependentInline, EmergencyContactInline]

# Registros individuales (por si se necesitan ver aparte)
admin.site.register(models.NationalId)
admin.site.register(models.Dependent)
admin.site.register(models.EmergencyContact)
admin.site.register(models.PersonDisabilityVE)
admin.site.register(models.Address)
admin.site.register(models.PersonEmail)
admin.site.register(models.PersonPhone)
admin.site.register(models.PersonBankAccount)
admin.site.register(models.PersonDocument)
admin.site.register(models.PersonNationality)