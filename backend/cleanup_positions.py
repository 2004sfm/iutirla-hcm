import os
import django
from django.db.models import Count

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from organization.models import Position
from employment.models import Employment

def clean_duplicates():
    print("Searching for duplicate positions...")
    duplicates = Position.objects.values('department', 'job_title').annotate(
        count=Count('id')
    ).filter(count__gt=1)

    for dup in duplicates:
        dept_id = dup['department']
        job_id = dup['job_title']
        
        positions = Position.objects.filter(department_id=dept_id, job_title_id=job_id).order_by('created_at')
        
        # Keep the first one, delete the rest
        primary = positions.first()
        others = positions[1:]
        
        print(f"Found {len(others) + 1} duplicates for Dept {dept_id} / Job {job_id}. Keeping ID {primary.id}.")
        
        for pos in others:
            print(f"  - Merging Position {pos.id} into {primary.id}...")
            
            # Reassign Employments
            Employment.objects.filter(position=pos).update(position=primary)
            
            # Reassign Direct Reports (Manager Position)
            Position.objects.filter(manager_position=pos).update(manager_position=primary)
            
            # Delete the duplicate
            pos.delete()
            print(f"  - Position {pos.id} deleted.")

    print("Cleanup complete.")

if __name__ == "__main__":
    clean_duplicates()
