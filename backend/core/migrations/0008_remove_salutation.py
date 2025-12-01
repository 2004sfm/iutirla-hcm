# Generated migration to remove Salutation model and salutation field from Person

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_refine_validations'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='person',
            name='salutation',
        ),
        migrations.RemoveField(
            model_name='historicalperson',
            name='salutation',
        ),
        migrations.DeleteModel(
            name='Salutation',
        ),
    ]
