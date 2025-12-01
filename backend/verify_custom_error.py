import os
import django
import sys

# Setup Django environment
sys.path.append('/home/sss/dev/projects/iutirla-hcm/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from talent.serializers import PersonLanguageSerializer
from talent.models import Language, Person, PersonLanguage

def test_custom_error_message():
    # Get test data
    person = Person.objects.first()
    language, _ = Language.objects.get_or_create(name="Test Language")
    
    # Ensure one entry exists
    PersonLanguage.objects.get_or_create(person=person, language=language)
    
    # Try to validate duplicate data
    data = {
        'person': person.id,
        'language': language.id,
        'speaking_proficiency': None
    }
    
    serializer = PersonLanguageSerializer(data=data)
    if not serializer.is_valid():
        errors = serializer.errors
        print(f"Validation Errors: {errors}")
        
        # Check for non_field_errors or field specific errors
        # UniqueTogetherValidator usually puts errors in non_field_errors
        if 'non_field_errors' in errors:
            messages = errors['non_field_errors']
            if "Esta persona ya tiene registrado este idioma." in messages:
                print("SUCCESS: Custom error message found.")
            else:
                print(f"FAIL: Custom message not found. Got: {messages}")
        else:
             print(f"FAIL: Error not in non_field_errors. Got: {errors}")
    else:
        print("FAIL: Serializer should be invalid for duplicate data.")

if __name__ == '__main__':
    test_custom_error_message()
