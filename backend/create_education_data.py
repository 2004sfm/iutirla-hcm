"""
Script para crear datos de prueba de Educación (Niveles y Áreas)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from talent.models import EducationLevel, FieldOfStudy

print("Creando niveles educativos...")
levels = [
    "Bachillerato",
    "Técnico Superior Universitario",
    "Licenciatura",
    "Ingeniería",
    "Maestría",
    "Doctorado"
]

for name in levels:
    EducationLevel.objects.get_or_create(name=name)
    print(f"- {name}")

print("\nCreando áreas de estudio...")
fields = [
    "Informática y Sistemas",
    "Recursos Humanos",
    "Administración de Empresas",
    "Contaduría Pública",
    "Educación",
    "Diseño Gráfico",
    "Psicología Industrial"
]

for name in fields:
    FieldOfStudy.objects.get_or_create(name=name)
    print(f"- {name}")

print("\n✅ Datos de educación creados exitosamente!")
