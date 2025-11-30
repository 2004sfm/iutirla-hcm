from rest_framework import viewsets, permissions
from .models import (
    PersonSpecialAssignment, BusinessFunction, PersonFunctionalExperience,
    PersonCertification, CertificationDocument, EducationLevel, FieldOfStudy,
    PersonEducation, PersonVolunteerExperience, PersonAward, PersonMembership,
    Language, LanguageProficiency,PersonLanguage
)
from .serializers import (
    PersonSpecialAssignmentSerializer, BusinessFunctionSerializer, PersonFunctionalExperienceSerializer,
    PersonCertificationSerializer, CertificationDocumentSerializer, EducationLevelSerializer, FieldOfStudySerializer,
    PersonEducationSerializer, PersonVolunteerExperienceSerializer, PersonAwardSerializer, PersonMembershipSerializer,
    LanguageSerializer, LanguageProficiencySerializer, PersonLanguageSerializer
)
from core.filters import UnaccentSearchFilter

class PersonSpecialAssignmentViewSet(viewsets.ModelViewSet):
    queryset = PersonSpecialAssignment.objects.all()
    serializer_class = PersonSpecialAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class BusinessFunctionViewSet(viewsets.ModelViewSet):
    queryset = BusinessFunction.objects.all()
    serializer_class = BusinessFunctionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name__unaccent']

class PersonFunctionalExperienceViewSet(viewsets.ModelViewSet):
    queryset = PersonFunctionalExperience.objects.all()
    serializer_class = PersonFunctionalExperienceSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PersonCertificationViewSet(viewsets.ModelViewSet):
    serializer_class = PersonCertificationSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        queryset = PersonCertification.objects.all()
        
        # --- FILTRO CRÍTICO ---
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person_id=person_id)
            
        return queryset

class CertificationDocumentViewSet(viewsets.ModelViewSet):
    queryset = CertificationDocument.objects.all()
    serializer_class = CertificationDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class EducationLevelViewSet(viewsets.ModelViewSet):
    queryset = EducationLevel.objects.all()
    serializer_class = EducationLevelSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name__unaccent']

class FieldOfStudyViewSet(viewsets.ModelViewSet):
    queryset = FieldOfStudy.objects.all()
    serializer_class = FieldOfStudySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name__unaccent']

class PersonEducationViewSet(viewsets.ModelViewSet):
    serializer_class = PersonEducationSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        # Optimizamos la consulta trayendo los nombres de Nivel y Campo
        queryset = PersonEducation.objects.select_related('level', 'field_of_study')
        
        # --- FILTRO CRÍTICO ---
        # Obtenemos el ID de la persona desde la URL (?person=1)
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person_id=person_id)
            
        return queryset

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

class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name__unaccent']

class LanguageProficiencyViewSet(viewsets.ModelViewSet):
    queryset = LanguageProficiency.objects.all()
    serializer_class = LanguageProficiencySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [UnaccentSearchFilter]
    search_fields = ['name__unaccent']

class PersonLanguageViewSet(viewsets.ModelViewSet):
    serializer_class = PersonLanguageSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        # Optimizamos la consulta trayendo los nombres de los idiomas y niveles
        queryset = PersonLanguage.objects.select_related(
            'language', 
            'speaking_proficiency', 
            'reading_proficiency', 
            'writing_proficiency'
        )
        
        # --- FILTRO CRÍTICO ---
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person_id=person_id)
            
        return queryset