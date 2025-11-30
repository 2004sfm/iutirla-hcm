from django.db.models.signals import post_save
from django.dispatch import receiver
from organization.models import Position
from .models import JobPosting

@receiver(post_save, sender=Position)
def close_job_posting_if_filled(sender, instance, **kwargs):
    """
    Cierra automáticamente las vacantes publicadas si la posición se llena.
    """
    if instance.vacancies <= 0:
        # Buscar vacantes PUBLICADAS asociadas a esta posición
        active_postings = JobPosting.objects.filter(
            position=instance,
            status='PUBLISHED'
        )
        
        if active_postings.exists():
            # Cerrarlas
            active_postings.update(status='CLOSED')
            print(f"INFO: Se cerraron {active_postings.count()} publicaciones para la posición '{instance}' por falta de cupos.")
