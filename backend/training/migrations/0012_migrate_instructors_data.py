# Generated manually - migrate instructor data

from django.db import migrations


def migrate_instructors_to_course(apps, schema_editor):
    """
    Migra instructores de CourseParticipant a Course.instructor
    """
    Course = apps.get_model('training', 'Course')
    CourseParticipant = apps.get_model('training', 'CourseParticipant')
    
    # Encuentra todos los participantes con role='INS'
    instructor_participants = CourseParticipant.objects.filter(role='INS')
    
    migrated_count = 0
    skipped_count = 0
    
    for participant in instructor_participants:
        course = participant.course
        
        if course.instructor is None:
            # Asignar instructor al curso
            course.instructor = participant.person
            course.save()
            migrated_count += 1
            print(f"✅ Migrado instructor {participant.person} a curso '{course.name}'")
        else:
            # Ya existe un instructor, registrar warning
            print(f"⚠️  Curso '{course.name}' ya tiene instructor {course.instructor}, " 
                  f"omitiendo {participant.person}")
            skipped_count += 1
    
    # Eliminar todos los participantes con role='INS'
    deleted_count, _ = CourseParticipant.objects.filter(role='INS').delete()
    
    print(f"\n📊 Resumen:")
    print(f"   - Instructores migrados: {migrated_count}")
    print(f"   - Duplicados omitidos: {skipped_count}")
    print(f"   - Registros eliminados: {deleted_count}")


def reverse_migration(apps, schema_editor):
    """
    Revierte la migración: mueve instructores de vuelta a CourseParticipant
    """
    Course = apps.get_model('training', 'Course')
    CourseParticipant = apps.get_model('training', 'CourseParticipant')
    
    courses_with_instructor = Course.objects.exclude(instructor__isnull=True)
    
    for course in courses_with_instructor:
        # Recrear participante instructor
        CourseParticipant.objects.create(
            course=course,
            person=course.instructor,
            role='INS',
            enrollment_status='ENR'
        )
        print(f"↩️  Revertido instructor {course.instructor} en curso '{course.name}'")


class Migration(migrations.Migration):

    dependencies = [
        ('training', '0011_course_instructor'),
    ]

    operations = [
        migrations.RunPython(
            migrate_instructors_to_course,
            reverse_migration
        ),
    ]
