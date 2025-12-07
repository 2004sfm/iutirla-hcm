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
    phone?: string;
    phone_area_code?: { id: number; code: string; carrier: string };
    phone_subscriber?: string;
    national_id: string;
    cv_file?: string;
    cv_url?: string;
    avatar?: string;
    stage: CandidateStage;
    stage_display?: string;
    education?: CandidateEducation[];
    applied_date?: string;
    created_at: string;
    updated_at: string;
    notes?: string;
}

export interface HireData {
    hire_date: string;
    role: number;
    employment_type: number;
    employment_status: number;
    salary?: string;
    notes?: string;
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
