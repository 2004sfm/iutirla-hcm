import os
import django
import sys

# Setup Django environment
sys.path.append('/home/sss/dev/projects/iutirla-hcm/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.serializers import AddressSerializer
from core.models import Address

def test_address_formatting():
    data = {
        'city': 'valencia',
        'street_name_and_number': 'avenida bolivar',
        'person': 1, # Assuming person 1 exists, but serializer validation might not check existence if we mock or just check field validation
        # We need minimal valid data for the serializer
    }
    
    # We can test the validation methods directly or the full serializer
    serializer = AddressSerializer()
    
    city_cleaned = serializer.validate_city('valencia')
    print(f"City 'valencia' -> '{city_cleaned}'")
    assert city_cleaned == 'Valencia'
    
    street_cleaned = serializer.validate_street_name_and_number('avenida bolivar')
    print(f"Street 'avenida bolivar' -> '{street_cleaned}'")
    assert street_cleaned == 'Avenida Bolivar'
    
    print("Verification successful!")

if __name__ == '__main__':
    test_address_formatting()
