import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from training.models import CourseResource

def cleanup():
    print("Cleaning up resources without lessons...")
    count = CourseResource.objects.filter(lesson__isnull=True).count()
    print(f"Found {count} resources without lessons.")
    if count > 0:
        CourseResource.objects.filter(lesson__isnull=True).delete()
        print("Deleted resources without lessons.")
    else:
        print("No resources to delete.")

if __name__ == "__main__":
    cleanup()
