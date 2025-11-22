from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'special-assignments', views.PersonSpecialAssignmentViewSet, basename='specialassignment')
router.register(r'business-functions', views.BusinessFunctionViewSet, basename='businessfunction')
router.register(r'functional-experiences', views.PersonFunctionalExperienceViewSet, basename='functionalexperience')
router.register(r'certifications', views.PersonCertificationViewSet, basename='certification')
router.register(r'certification-documents', views.CertificationDocumentViewSet, basename='certificationdocument')
router.register(r'education-levels', views.EducationLevelViewSet, basename='educationlevel')
router.register(r'fields-of-study', views.FieldOfStudyViewSet, basename='fieldofstudy')
router.register(r'education', views.PersonEducationViewSet, basename='education')
router.register(r'volunteer-experiences', views.PersonVolunteerExperienceViewSet, basename='volunteerexperience')
router.register(r'awards', views.PersonAwardViewSet, basename='award')
router.register(r'memberships', views.PersonMembershipViewSet, basename='membership')

urlpatterns = [
    path('', include(router.urls)),
]