from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicJobPostingViewSet,
    PublicCandidateApplicationViewSet,
    JobPostingViewSet,
    CandidateViewSet
)
from .views_options import EducationOptionsViewSet, PhoneCarrierCodeOptionsViewSet

# Router para endpoints administrativos (renombrado de admin_router a router)
router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet, basename='admin-jobs')
router.register(r'candidates', CandidateViewSet, basename='admin-candidates')

# Router para endpoints públicos
public_router = DefaultRouter()
public_router.register(r'jobs', PublicJobPostingViewSet, basename='public-jobs')
public_router.register(r'apply', PublicCandidateApplicationViewSet, basename='public-apply')
public_router.register(r'education-options', EducationOptionsViewSet, basename='public-education-options')
public_router.register(r'phone-codes', PhoneCarrierCodeOptionsViewSet, basename='public-phone-codes')

urlpatterns = [
    # Rutas públicas (sin autenticación)
    path('public/', include(public_router.urls)),

    # Rutas administrativas (con autenticación)
    path('', include(router.urls)),
]
