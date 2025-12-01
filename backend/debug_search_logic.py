import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from organization.models import Department
from core.filters import UnaccentSearchFilter
from core.db_utils import remove_accents

from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from organization.views import DepartmentViewSet

# List all departments
print("--- All Departments ---")
for d in Department.objects.all():
    print(f"- {d.name} (ID: {d.id})")

# Setup Request
factory = APIRequestFactory()
request = factory.get('/api/organization/departments/', {'search': 'direccion a'})
request = Request(request)

# Setup View
view = DepartmentViewSet()
view.request = request
view.format_kwarg = None

# Execute Filter
print("\n--- Executing UnaccentSearchFilter ---")
filter_backend = UnaccentSearchFilter()
queryset = Department.objects.all()
filtered_queryset = filter_backend.filter_queryset(request, queryset, view)

print(f"Result count: {filtered_queryset.count()}")
for d in filtered_queryset:
    print(f"MATCH: {d.name}")

if filtered_queryset.filter(name="Dirección").exists():
    print("\nFAILURE: 'Dirección' was found in results!")
else:
    print("\nSUCCESS: 'Dirección' was NOT found in results.")
