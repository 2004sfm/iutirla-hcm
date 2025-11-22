from rest_framework import serializers
from django.utils import timezone
from datetime import date
from core.serializers import title_case_cleaner

from .models import (
    PersonSpecialAssignment, BusinessFunction, PersonFunctionalExperience,
    PersonCertification, CertificationDocument, EducationLevel, FieldOfStudy,
    PersonEducation, PersonVolunteerExperience, PersonAward, PersonMembership
)

def validate_date_range(data, start_field='start_date', end_field='end_date'):
    """Valida que la fecha de fin no sea anterior a la de inicio."""
    start = data.get(start_field)
    end = data.get(end_field)
    
    if start and end and end < start:
        raise serializers.ValidationError({
            end_field: "La fecha de finalización no puede ser anterior a la fecha de inicio."
        })
    return data

# --- Serializers de Catálogo ---

class BusinessFunctionSerializer(serializers.ModelSerializer):
    class Meta: model = BusinessFunction; fields = '__all__'
    def validate_name(self, value): return title_case_cleaner(value)

class EducationLevelSerializer(serializers.ModelSerializer):
    class Meta: model = EducationLevel; fields = '__all__'
    def validate_name(self, value): return title_case_cleaner(value)

class FieldOfStudySerializer(serializers.ModelSerializer):
    class Meta: model = FieldOfStudy; fields = '__all__'
    def validate_name(self, value): return title_case_cleaner(value)

# --- Serializers Transaccionales ---

class PersonSpecialAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonSpecialAssignment
        fields = '__all__'
    
    def validate_project_name(self, value): return title_case_cleaner(value)
    
    def validate(self, data):
        return validate_date_range(data)

class PersonFunctionalExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonFunctionalExperience
        fields = '__all__'

    def validate(self, data):
        return validate_date_range(data)

class PersonCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonCertification
        fields = '__all__'

    def validate_name(self, value): return title_case_cleaner(value)
    def validate_institution(self, value): return title_case_cleaner(value)

    def validate(self, data):
        # Validamos 'effective_date' vs 'expiration_date'
        return validate_date_range(data, start_field='effective_date', end_field='expiration_date')

class CertificationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificationDocument
        fields = '__all__'

class PersonEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonEducation
        fields = '__all__'

    def validate_school_name(self, value): return title_case_cleaner(value)

    def validate(self, data):
        return validate_date_range(data)

class PersonVolunteerExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonVolunteerExperience
        fields = '__all__'

    def validate_organization_name(self, value): return title_case_cleaner(value)
    def validate_role(self, value): return title_case_cleaner(value)

    def validate(self, data):
        return validate_date_range(data)

class PersonAwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonAward
        fields = '__all__'

    def validate_name(self, value): return title_case_cleaner(value)
    def validate_institution(self, value): return title_case_cleaner(value)

    def validate_issue_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("La fecha de obtención del premio no puede ser futura.")
        return value

class PersonMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonMembership
        fields = '__all__'

    def validate_organization_name(self, value): return title_case_cleaner(value)
    def validate_role(self, value): return title_case_cleaner(value)

    def validate(self, data):
        return validate_date_range(data)