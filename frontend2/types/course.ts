// TypeScript interfaces matching backend training models

// --- ENUMS (matching Django choices) ---

export enum CourseStatus {
    DRAFT = 'BOR',
    SCHEDULED = 'PRO',
    IN_PROGRESS = 'EJE',
    COMPLETED = 'FIN',
    CANCELLED = 'CAN',
}

export enum CourseModality {
    PRESENTIAL = 'PRE',
    VIRTUAL_SYNC = 'VIR',
    VIRTUAL_ASYNC = 'ASY',
    HYBRID = 'MIX',
}

// 🔧 REFACTOR: ParticipantRole removed - all participants are students now

export enum EnrollmentStatus {
    REQUESTED = 'REQ',
    ENROLLED = 'ENR',
    REJECTED = 'REJ',
}

export enum AcademicStatus {
    PENDING = 'PEN',
    COMPLETED = 'COM',  // 🆕 NEW
    PASSED = 'APR',
    FAILED = 'REP',
}

export enum AttendanceStatus {
    PRESENT = 'PRE',
    ABSENT = 'AUS',
    LATE = 'TAR',
    EXCUSED = 'JUS',
}

// --- DISPLAY NAME HELPERS (Spanish) ---

export const courseStatusDisplay: Record<CourseStatus, string> = {
    [CourseStatus.DRAFT]: 'Borrador',
    [CourseStatus.SCHEDULED]: 'Programado',
    [CourseStatus.IN_PROGRESS]: 'En Ejecución',
    [CourseStatus.COMPLETED]: 'Finalizado',
    [CourseStatus.CANCELLED]: 'Cancelado',
};

export const courseModalityDisplay: Record<CourseModality, string> = {
    [CourseModality.PRESENTIAL]: 'Presencial',
    [CourseModality.VIRTUAL_SYNC]: 'Virtual (En Vivo / Zoom)',
    [CourseModality.VIRTUAL_ASYNC]: 'Virtual (Autoaprendizaje)',
    [CourseModality.HYBRID]: 'Híbrido / Mixto',
};

export const enrollmentStatusDisplay: Record<EnrollmentStatus, string> = {
    [EnrollmentStatus.REQUESTED]: 'Solicitud Enviada',
    [EnrollmentStatus.ENROLLED]: 'Inscrito',
    [EnrollmentStatus.REJECTED]: 'Solicitud Rechazada',
};

export const academicStatusDisplay: Record<AcademicStatus, string> = {
    [AcademicStatus.PENDING]: 'En Curso',
    [AcademicStatus.COMPLETED]: 'Completado',  // 🆕 NEW
    [AcademicStatus.PASSED]: 'Aprobado',
    [AcademicStatus.FAILED]: 'Reprobado',
};

// --- INTERFACES ---

export interface CourseResource {
    id: number;
    name: string;
    resource_type: string;
    file?: string;
    file_url?: string; // 🆕 NEW: Added file_url
    url?: string;
    created_at: string;
}

export interface CourseSession {
    id: number;
    course_name?: string;
    topic: string;
    date: string;
    start_time: string;
    end_time: string;
}

// 🆕 NEW: Hierarchical Content Interfaces

export interface CourseLesson {
    id: number;
    module: number;
    module_name: string;
    title: string;
    content: string;
    order: number;
    duration_minutes: number;
    resources?: CourseResource[];
    course_id?: number;
    course_instructor_id?: number;
}

export interface CourseModule {
    id: number;
    course: number;
    name: string;
    description?: string;
    order: number;
    lessons: CourseLesson[];
    lesson_count: number;
}

export interface LessonProgress {
    id: number;
    enrollment: number;
    lesson: number;
    lesson_title?: string;
    person_name?: string;
    completed: boolean;
    completed_at?: string;
}

export interface CourseProgress {
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
    is_complete: boolean;
}

export interface ParticipantListItem {
    id: number;
    person_id: number;
    person_name: string;
    person_id_document?: string;
    // 🔧 REFACTOR: role removed - all participants are students
    enrollment_status: EnrollmentStatus;
    enrollment_status_name: string;
    academic_status: AcademicStatus;
    academic_status_name: string;
    grade?: number;
}

export interface CourseParticipant extends ParticipantListItem {
    course: number;
    person: number;
}

export interface Course {
    id: number;
    name: string;
    description?: string;
    cover_image?: string;
    start_date: string;
    end_date: string;
    modality: CourseModality;
    modality_display: string;
    max_participants: number;
    duration_hours: number;
    status: CourseStatus;
    status_name: string;
    enrolled_count: number;
    is_full: boolean;
    is_public: boolean;
    department?: number;
    created_at: string;
    updated_at: string;

    // 🔧 REFACTOR: Instructor ahora es un campo directo del curso
    instructor_id?: number;
    instructor_name?: string;
    instructor_id_document?: string;

    // 🆕 NEW: Grading logic
    requires_approval_to_complete: boolean;

    // Nested data (in detail view)
    students?: ParticipantListItem[]; // Solo estudiantes ahora
    resources?: CourseResource[];
    sessions?: CourseSession[];
    modules?: CourseModule[];  // 🆕 NEW: Hierarchical content
}

export interface AttendanceRecord {
    id: number;
    session: number;
    participant: number;
    person_name: string;
    status: AttendanceStatus;
    status_display: string;
    notes?: string;
}

// --- USER ENROLLMENT INFO (for CourseHeader logic) ---

export interface UserEnrollment {
    id?: number;
    enrollment_status?: EnrollmentStatus;
    academic_status?: AcademicStatus;
    // 🔧 REFACTOR: role removed
    grade?: number;
}
