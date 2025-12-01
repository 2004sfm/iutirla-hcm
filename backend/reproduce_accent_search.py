import os
import django
from django.test import RequestFactory

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from organization.models import Department
from organization.views import DepartmentViewSet
from core.filters import UnaccentSearchFilter

# Setup data
Department.objects.all().delete()
dept = Department.objects.create(name="Dirección")

print(f"Created Department: {dept.name}")

from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

# Test Case 1: Search with accent (Exact match)
print("\n--- Case 1: Search 'Dirección' ---")
factory = APIRequestFactory()
request = factory.get('/api/organization/departments/', {'search': 'Dirección'})
request = Request(request) # Wrap in DRF Request
view = DepartmentViewSet()
view.request = request
view.format_kwarg = None

# Manually apply filter
filter_backend = UnaccentSearchFilter()
queryset = Department.objects.all()
filtered_queryset = filter_backend.filter_queryset(request, queryset, view)
print(f"Result count: {filtered_queryset.count()}")
if filtered_queryset.count() == 1:
    print("SUCCESS")
else:
    print("FAILURE")

# Test Case 2: Search without accent (The issue)
print("\n--- Case 2: Search 'Direccion' ---")
request = factory.get('/api/organization/departments/', {'search': 'Direccion'})
request = Request(request)
view.request = request

filtered_queryset = filter_backend.filter_queryset(request, queryset, view)
print(f"Result count: {filtered_queryset.count()}")
if filtered_queryset.count() == 1:
    print("SUCCESS")
else:
    print("FAILURE (Expected if SQLite doesn't handle unaccent)")
