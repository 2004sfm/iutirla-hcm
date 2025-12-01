import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from organization.models import Department
from organization.views import DepartmentViewSet
from core.filters import UnaccentSearchFilter

# Ensure "Dirección" exists
if not Department.objects.filter(name="Dirección").exists():
    print("Creating 'Dirección' department...")
    Department.objects.create(name="Dirección")

# Test 1: Search "direccion " (with space) -> Should NOT match "Dirección"
print("\n--- Test 1: Search 'direccion ' (trailing space) ---")
factory = APIRequestFactory()
request = factory.get('/api/organization/departments/', {'search': 'direccion '})
request = Request(request)
view = DepartmentViewSet()
view.request = request
view.format_kwarg = None

filter_backend = UnaccentSearchFilter()
queryset = Department.objects.all()
filtered_queryset = filter_backend.filter_queryset(request, queryset, view)

print(f"Result count: {filtered_queryset.count()}")
found = False
for d in filtered_queryset:
    print(f" - {d.name}")
    if d.name == "Dirección":
        found = True

if found:
    print("FAILURE: 'Dirección' matches 'direccion ' (it shouldn't!)")
else:
    print("SUCCESS: 'Dirección' does NOT match 'direccion '")

# Test 2: Search "direccion" (no space) -> Should match "Dirección"
print("\n--- Test 2: Search 'direccion' (no space) ---")
request2 = factory.get('/api/organization/departments/', {'search': 'direccion'})
request2 = Request(request2)
view.request = request2

filtered_queryset2 = filter_backend.filter_queryset(request2, queryset, view)
print(f"Result count: {filtered_queryset2.count()}")
found2 = False
for d in filtered_queryset2:
    print(f" - {d.name}")
    if d.name == "Dirección":
        found2 = True

if found2:
    print("SUCCESS: 'Dirección' matches 'direccion'")
else:
    print("FAILURE: 'Dirección' does NOT match 'direccion'")
