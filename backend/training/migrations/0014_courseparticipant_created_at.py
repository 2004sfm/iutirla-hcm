from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('training', '0013_remove_courseparticipant_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='courseparticipant',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, verbose_name='Fecha de Solicitud'),
            preserve_default=False,
        ),
    ]
