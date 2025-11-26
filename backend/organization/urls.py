from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, JobTitleViewSet, PositionViewSet, PositionObjectiveViewSet, PositionRequirementViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'job-titles', JobTitleViewSet, basename='jobtitle')
router.register(r'positions', PositionViewSet, basename='position')

urlpatterns = [
    path('', include(router.urls)),
    # Rutas anidadas para objetivos y requerimientos
    path('positions/<int:position_pk>/objectives/', PositionObjectiveViewSet.as_view({'get': 'list', 'post': 'create'}), name='position-objectives-list'),
    path('positions/<int:position_pk>/objectives/<int:pk>/', PositionObjectiveViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='position-objectives-detail'),
    path('positions/<int:position_pk>/requirements/', PositionRequirementViewSet.as_view({'get': 'list', 'post': 'create'}), name='position-requirements-list'),
    path('positions/<int:position_pk>/requirements/<int:pk>/', PositionRequirementViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='position-requirements-detail'),
]