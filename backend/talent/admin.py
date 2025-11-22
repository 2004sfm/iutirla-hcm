from django.contrib import admin
from . import models

admin.site.register(models.PersonSpecialAssignment)
admin.site.register(models.BusinessFunction)
admin.site.register(models.PersonFunctionalExperience)
admin.site.register(models.PersonCertification)
admin.site.register(models.CertificationDocument)
admin.site.register(models.EducationLevel)
admin.site.register(models.FieldOfStudy)
admin.site.register(models.PersonEducation)
admin.site.register(models.PersonVolunteerExperience)
admin.site.register(models.PersonAward)
admin.site.register(models.PersonMembership)