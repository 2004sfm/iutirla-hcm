from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'periods', views.EvaluationPeriodViewSet, basename='period')
router.register(r'competencies', views.CompetencyViewSet, basename='competency')
router.register(r'reviews', views.PerformanceReviewViewSet, basename='review')
router.register(r'details', views.ReviewDetailViewSet, basename='review-detail')

urlpatterns = [
    path('', include(router.urls)),
]