from django.db import migrations

def migrate_status(apps, schema_editor):
    CourseParticipant = apps.get_model('training', 'CourseParticipant')
    for participant in CourseParticipant.objects.all():
        old_status = participant.status
        
        # Mapeo: 'SOL' -> ('REQ', 'NEV')
        if old_status == 'SOL':
            participant.enrollment_status = 'REQ'
            participant.academic_status = 'NEV'
        # Mapeo: 'INS' -> ('ENR', 'PEN')
        elif old_status == 'INS':
            participant.enrollment_status = 'ENR'
            participant.academic_status = 'PEN'
        # Mapeo: 'PEN' -> ('ENR', 'PEN')
        elif old_status == 'PEN':
            participant.enrollment_status = 'ENR'
            participant.academic_status = 'PEN'
        # Mapeo: 'APR' -> ('ENR', 'APR')
        elif old_status == 'APR':
            participant.enrollment_status = 'ENR'
            participant.academic_status = 'APR'
        # Mapeo: 'REP' -> ('ENR', 'REP')
        elif old_status == 'REP':
            participant.enrollment_status = 'ENR'
            participant.academic_status = 'REP'
        # Mapeo: 'REJ' -> ('REJ', 'NEV')
        elif old_status == 'REJ':
            participant.enrollment_status = 'REJ'
            participant.academic_status = 'NEV'
        # Mapeo: 'RET' -> ('DRP', 'NEV')
        elif old_status == 'RET':
            participant.enrollment_status = 'DRP'
            participant.academic_status = 'NEV'
            
        participant.save()

class Migration(migrations.Migration):

    dependencies = [
        ('training', '0006_courseparticipant_academic_status_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_status),
    ]
