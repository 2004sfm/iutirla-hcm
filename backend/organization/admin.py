from django.contrib import admin
from . import models

admin.site.register(models.Department)
admin.site.register(models.JobTitle)
admin.site.register(models.Position)
admin.site.register(models.PositionRequirement)
admin.site.register(models.PositionFunction)