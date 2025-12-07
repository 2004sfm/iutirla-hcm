# Generated manually - refactor instructor model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_alter_historicalperson_birthdate'),
        ('training', '0010_alter_courseparticipant_academic_status_and_more'),
    ]

    operations = [
        # Add instructor field to Course
        migrations.AddField(
            model_name='course',
            name='instructor',
            field=models.ForeignKey(
                blank=True, 
                null=True, 
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='courses_taught', 
                to='core.person',
                verbose_name='Instructor'
            ),
        ),
    ]
