from rest_framework import permissions

class IsInstructorOrAdmin(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        # --- REGLA 1: PODER SUPREMO DEL ADMIN ---
        if request.user.is_staff or request.user.is_superuser:
            return True

        # --- REGLA 2: PROTECCIÓN CONTRA BORRADO ---
        # Nadie más que el admin puede eliminar registros
        if request.method == 'DELETE':
            return False

        # --- LÓGICA DE NAVEGACIÓN AL CURSO ---
        course = None
        
        # Caso A: El objeto es el Curso mismo
        if hasattr(obj, 'participants'): 
            course = obj
        # Caso B: El objeto es directo del curso (Resource, Session, Participant)
        elif hasattr(obj, 'course'):
            course = obj.course
        # Caso C: El objeto es nieto (AttendanceRecord -> Session -> Course)
        elif hasattr(obj, 'session'):
            course = obj.session.course

        # Si no se pudo determinar el curso o usuario sin perfil, denegar.
        if not course or not hasattr(request.user, 'person'):
            return False

        # --- REGLA 3: PERMISOS DEL INSTRUCTOR ---
        # Acceso total (menos borrar) sobre SU curso
        # 🔧 REFACTOR: Verificar instructor con course.instructor
        is_instructor = course.instructor == request.user.person

        if is_instructor:
            return True

        # --- REGLA 4: PERMISOS DEL ESTUDIANTE INSCRITO ---
        # Solo lectura sobre SU curso
        is_student = course.participants.filter(
            person=request.user.person
        ).exists()

        if is_student:
            if request.method in permissions.SAFE_METHODS:
                return True

        # --- REGLA 5: PERMISOS DE CATÁLOGO (USUARIO GENERAL) ---
        # Si no es ni instructor ni estudiante, pero el curso es PÚBLICO,
        # permitimos ver los detalles para que pueda decidir inscribirse.
        if request.method in permissions.SAFE_METHODS: # Solo GET/OPTIONS
            # Verificamos si el estatus es 'PRO' (Programado) o 'EJE' (En Ejecución)
            if course.status in ['PRO', 'EJE']:
                return True

        return False