import os
import django
import sys

# Setup Django environment
sys.path.append('/home/sss/dev/projects/iutirla-hcm/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from talent.models import PersonLanguage

def test_field_existence():
    try:
        # Check if the field exists on the model
        field = PersonLanguage._meta.get_field('reading_proficiency')
        print(f"SUCCESS: Field '{field.name}' exists on PersonLanguage model.")
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == '__main__':
    test_field_existence()
