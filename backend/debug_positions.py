from organization.models import Position, PositionFunction

print('=== POSICIONES ===')
for p in Position.objects.all()[:10]:
    print(f'Pos {p.id}: {p.job_title.name} - {p.department.name}')

print('\n=== FUNCIONES ===')
funcs = PositionFunction.objects.all()[:10]
print(f'Total funciones: {PositionFunction.objects.count()}')
for f in funcs:
    print(f'Func {f.id}: Pos {f.position_id} ({f.position.job_title.name} - {f.position.department.name})')
