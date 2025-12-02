# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('organization', '0001_initial'),
        ('training', '0008_remove_courseparticipant_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='is_public',
            field=models.BooleanField(default=True, help_text='Si es público, todos pueden ver el curso. Si es privado, solo el departamento asignado.', verbose_name='Curso Público'),
        ),
        migrations.AddField(
            model_name='course',
            name='department',
            field=models.ForeignKey(blank=True, help_text='Departamento al que pertenece este curso (solo si es privado)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='courses', to='organization.department', verbose_name='Departamento'),
        ),
    ]
