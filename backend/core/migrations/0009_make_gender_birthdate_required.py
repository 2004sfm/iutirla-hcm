# Generated migration to make gender and birthdate required fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_remove_salutation'),
    ]

    operations = [
        # First, set default values for existing NULL records
        # This is a data migration step that should be done before altering the field
        migrations.RunSQL(
            # For gender: set to first available gender if NULL
            sql="""
                UPDATE core_person 
                SET gender_id = (SELECT id FROM core_gender LIMIT 1)
                WHERE gender_id IS NULL;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            # For birthdate: set to a default date (e.g., 1900-01-01) if NULL
            sql="""
                UPDATE core_person 
                SET birthdate = '1900-01-01'
                WHERE birthdate IS NULL;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Now alter the fields to be non-nullable
        migrations.AlterField(
            model_name='person',
            name='gender',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='core.gender'),
        ),
        migrations.AlterField(
            model_name='person',
            name='birthdate',
            field=models.DateField(),
        ),
    ]
