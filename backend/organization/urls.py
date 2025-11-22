from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, JobTitleViewSet, PositionViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'jobtitles', JobTitleViewSet, basename='jobtitle')
router.register(r'positions', PositionViewSet, basename='position')

urlpatterns = [
    path('', include(router.urls)),
]