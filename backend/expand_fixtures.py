#!/usr/bin/env python3
"""
Expandir initial_data.json para incluir TODOS los requirements y functions
Este script lee el archivo actual y agrega TODAS las funciones faltantes
"""
import json

# Cargo el archivo actual
with open('organization/fixtures/initial_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Contar qué tenemos
depts = [d for d in data if d['model'] == 'organization.department']
jobs = [d for d in data if d['model'] == 'organization.jobtitle']
positions = [d for d in data if d['model'] == 'organization.position']
requirements = [d for d in data if d['model'] == 'organization.positionrequirement']
functions = [d for d in data if d['model'] == 'organization.positionfunction']

print(f"Estado actual:")
print(f"  Departments: {len(depts)}")
print(f"  JobTitles: {len(jobs)}")
print(f"  Positions: {len(positions)}")
print(f"  Requirements: {len(requirements)}")
print(f"  Functions: {len(functions)}")
print(f"\nNecesito agregar TODOS los requirements y functions faltantes...")

# Calculo los PKs actuales
current_req_pk = max([r['pk'] for r in requirements], default=0) + 1
current_func_pk = max([f['pk'] for f in functions], default=0) + 1

print(f"Próximo req PK: {current_req_pk}")
print(f"Próximo func PK: {current_func_pk}")

# Ahora necesito agregar todos los faltantes
# Position 4: Recepcionista
print("\nAgregando Position 4: Recepcionista...")

