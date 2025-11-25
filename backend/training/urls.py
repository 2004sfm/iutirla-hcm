from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# 1. Cursos (Gestión principal)
router.register(r'courses', views.CourseViewSet, basename='course')

# 2. Recursos (Archivos y Links)
router.register(r'resources', views.CourseResourceViewSet, basename='course-resource')

# 3. Sesiones (Clases individuales para asistencia)
router.register(r'sessions', views.CourseSessionViewSet, basename='course-session')

# 4. Participantes (Inscripciones de alumnos e instructores)
router.register(r'participants', views.CourseParticipantViewSet, basename='course-participant')

# 5. Asistencia (Registros puntuales)
router.register(r'attendance', views.AttendanceRecordViewSet, basename='attendance-record')

urlpatterns = [
    path('', include(router.urls)),
]