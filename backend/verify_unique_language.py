import os
import django
import sys
from django.db.utils import IntegrityError

# Setup Django environment
sys.path.append('/home/sss/dev/projects/iutirla-hcm/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Person
from talent.models import Language, PersonLanguage

def test_unique_language():
    # Get or create a test person
    person = Person.objects.first()
    if not person:
        print("No person found to test with.")
        return

    # Get or create a test language
    language, _ = Language.objects.get_or_create(name="Test Language")

    # Clear existing entries for this test
    PersonLanguage.objects.filter(person=person, language=language).delete()

    # Create first entry
    print("Creating first entry...")
    PersonLanguage.objects.create(person=person, language=language)
    print("First entry created.")

    # Attempt to create second entry
    print("Attempting to create duplicate entry...")
    try:
        PersonLanguage.objects.create(person=person, language=language)
        print("FAIL: Duplicate entry created!")
    except IntegrityError:
        print("SUCCESS: IntegrityError raised for duplicate entry.")
    except Exception as e:
        print(f"SUCCESS: Exception raised: {e}")

if __name__ == '__main__':
    test_unique_language()
