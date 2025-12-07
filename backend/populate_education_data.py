#!/usr/bin/env python
"""
Script para poblar niveles educativos y campos de estudio con relaciones apropiadas.
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from talent.models import EducationLevel, FieldOfStudy

def populate_education_data():
    """Poblar datos de educación con relaciones jerárquicas."""
    
    print("=== Limpiando datos existentes ===")
    FieldOfStudy.objects.all().delete()
    print(f"✓ Eliminados todos los campos de estudio")
    
    # Datos organizados: nivel -> lista de campos de estudio
    education_data = {
        "Bachillerato": [
            "Ciencias",
            "Humanidades",
            "Artes",
            "Comercio",
        ],
        "Técnico Superior": [
            "Informática",
            "Administración",
            "Contaduría",
            "Diseño Gráfico",
            "Mercadeo",
            "Recursos Humanos",
            "Electrónica",
            "Mecánica",
            "Enfermería",
        ],
        "Licenciatura": [
            "Administración de Empresas",
            "Contaduría Pública",
            "Educación",
            "Psicología",
            "Comunicación Social",
            "Relaciones Industriales",
            "Economía",
            "Mercadeo",
        ],
        "Ingeniería": [
            "Ingeniería de Sistemas",
            "Ingeniería Industrial",
            "Ingeniería Civil",
            "Ingeniería Eléctrica",
            "Ingeniería Mecánica",
            "Ingeniería Electrónica",
            "Ingeniería Química",
            "Ingeniería de Telecomunicaciones",
        ],
        "Maestría": [
            "Gerencia Empresarial",
            "Finanzas",
            "Recursos Humanos",
            "Tecnología Educativa",
            "Administración Pública",
            "Gerencia de Proyectos",
            "Mercadeo y Ventas",
            "Ingeniería de Software",
            "Ciencia de Datos",
        ],
        "Doctorado": [
            "Ciencias Administrativas",
            "Ciencias de la Educación",
            "Ciencias Sociales",
            "Ingeniería",
            "Ciencias Económicas",
        ],
        "Diplomado": [
            "Gerencia de Proyectos",
            "Recursos Humanos",
            "Finanzas Corporativas",
            "Marketing Digital",
            "Gestión de la Calidad",
            "Seguridad Industrial",
        ],
    }
    
    print("\n=== Creando campos de estudio por nivel ===")
    total_created = 0
    
    for level_name, fields in education_data.items():
        try:
            level = EducationLevel.objects.get(name=level_name)
            print(f"\n📚 {level_name}:")
            
            for field_name in fields:
                field, created = FieldOfStudy.objects.get_or_create(
                    education_level=level,
                    name=field_name
                )
                if created:
                    print(f"  ✓ {field_name}")
                    total_created += 1
                else:
                    print(f"  - {field_name} (ya existe)")
                    
        except EducationLevel.DoesNotExist:
            print(f"⚠️  Nivel '{level_name}' no encontrado, omitiendo...")
    
    print(f"\n=== Resumen ===")
    print(f"✓ Total campos de estudio creados: {total_created}")
    print(f"✓ Total niveles educativos: {EducationLevel.objects.count()}")
    print(f"✓ Total campos de estudio: {FieldOfStudy.objects.count()}")
    
    # Mostrar resumen por nivel
    print("\n=== Distribución por nivel ===")
    for level in EducationLevel.objects.all():
        count = level.fields_of_study.count()
        print(f"  {level.name}: {count} campos")

if __name__ == '__main__':
    populate_education_data()
