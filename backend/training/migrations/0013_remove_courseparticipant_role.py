# Generated manually - remove role field

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('training', '0012_migrate_instructors_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='courseparticipant',
            name='role',
        ),
    ]
