from rest_framework import viewsets, permissions
from .models import (
    PersonSpecialAssignment, BusinessFunction, PersonFunctionalExperience,
    PersonCertification, CertificationDocument, EducationLevel, FieldOfStudy,
    PersonEducation, PersonVolunteerExperience, PersonAward, PersonMembership
)
from .serializers import (
    PersonSpecialAssignmentSerializer, BusinessFunctionSerializer, PersonFunctionalExperienceSerializer,
    PersonCertificationSerializer, CertificationDocumentSerializer, EducationLevelSerializer, FieldOfStudySerializer,
    PersonEducationSerializer, PersonVolunteerExperienceSerializer, PersonAwardSerializer, PersonMembershipSerializer
)

class PersonSpecialAssignmentViewSet(viewsets.ModelViewSet):
    queryset = PersonSpecialAssignment.objects.all()
    serializer_class = PersonSpecialAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class BusinessFunctionViewSet(viewsets.ModelViewSet):
    queryset = BusinessFunction.objects.all()
    serializer_class = BusinessFunctionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonFunctionalExperienceViewSet(viewsets.ModelViewSet):
    queryset = PersonFunctionalExperience.objects.all()
    serializer_class = PersonFunctionalExperienceSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonCertificationViewSet(viewsets.ModelViewSet):
    queryset = PersonCertification.objects.all()
    serializer_class = PersonCertificationSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class CertificationDocumentViewSet(viewsets.ModelViewSet):
    queryset = CertificationDocument.objects.all()
    serializer_class = CertificationDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EducationLevelViewSet(viewsets.ModelViewSet):
    queryset = EducationLevel.objects.all()
    serializer_class = EducationLevelSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class FieldOfStudyViewSet(viewsets.ModelViewSet):
    queryset = FieldOfStudy.objects.all()
    serializer_class = FieldOfStudySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonEducationViewSet(viewsets.ModelViewSet):
    queryset = PersonEducation.objects.all()
    serializer_class = PersonEducationSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonVolunteerExperienceViewSet(viewsets.ModelViewSet):
    queryset = PersonVolunteerExperience.objects.all()
    serializer_class = PersonVolunteerExperienceSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonAwardViewSet(viewsets.ModelViewSet):
    queryset = PersonAward.objects.all()
    serializer_class = PersonAwardSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonMembershipViewSet(viewsets.ModelViewSet):
    queryset = PersonMembership.objects.all()
    serializer_class = PersonMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]