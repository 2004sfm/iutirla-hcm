from django.contrib import admin
from . import models

admin.site.register(models.Role)
admin.site.register(models.EmploymentType)
admin.site.register(models.EmploymentStatus)
admin.site.register(models.Employment)
admin.site.register(models.EmploymentStatusLog)