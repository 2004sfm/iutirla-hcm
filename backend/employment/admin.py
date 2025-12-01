from django.contrib import admin
from .models import Employment, EmploymentStatusLog, EmploymentDepartmentRole

# Registrar los modelos en el admin de Django
admin.site.register(Employment)
admin.site.register(EmploymentStatusLog)
admin.site.register(EmploymentDepartmentRole)