// Tipos para el módulo ATS (Applicant Tracking System)

export type JobPostingStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'FROZEN';
export type CandidateStage = 'NEW' | 'REV' | 'INT' | 'OFF' | 'HIRED' | 'REJ' | 'POOL';

export interface JobPosting {
    id: number;
    title: string;
    position: number;
    position_title?: string;
    department_name?: string;
    description: string;
    location?: string;
    salary_min?: string;
    salary_max?: string;
    salary_range?: string;
    closing_date?: string;
    status: JobPostingStatus;
    ask_education: boolean;

    position_objectives?: string[];
    position_requirements?: string[];
    published_date?: string;
    created_at: string;
    updated_at: string;
    candidates_count?: number;
}

export interface CandidateEducation {
    id: number;
    school_name: string;
    level_name: string;
    field_name: string;
    start_date: string;
    end_date?: string;
}

export interface Candidate {
    id: number;
    job_posting: number;
    job_posting_title?: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    email: string;
    phone?: string; // Formato antiguo
    phone_area_code?: { id: number; code: string; carrier: string }; // Nuevo formato
    phone_subscriber?: string; // Nuevo formato
    national_id: string;
    cv_file?: string; // Ruta del archivo
    cv_url?: string; // URL completa (desde el serializer)
    avatar?: string; // URL del avatar
    stage: CandidateStage;
    stage_display?: string;
    education?: CandidateEducation[];
    applied_date?: string; // Deprecated, usar created_at
    created_at: string;
    updated_at: string;
}

export interface HireData {
    start_date: string;
    salary: string;
}

// Mapeo de etapas a labels legibles
export const CANDIDATE_STAGE_LABELS: Record<CandidateStage, string> = {
    NEW: 'Nuevo',
    REV: 'En revisión',
    INT: 'Entrevista',
    OFF: 'Oferta',
    HIRED: 'Contratado',
    REJ: 'Rechazado',
    POOL: 'Banco de Elegibles',
};

export const JOB_STATUS_LABELS: Record<JobPostingStatus, string> = {
    DRAFT: 'Borrador',
    PUBLISHED: 'Publicada',
    CLOSED: 'Cerrada',
    FROZEN: 'Congelada',
};
