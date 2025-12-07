export interface Competency {
    id: number;
    name: string;
    description: string;
    category: string;
    category_display: string;
    is_global: boolean;
    job_titles?: number[];
}

export interface ReviewDetail {
    id?: number;
    competency: number;
    competency_name: string;
    competency_description: string;
    competency_category: string;
    competency_category_display: string;
    score: number;
    comment?: string;
}

export interface PerformanceReview {
    id: number;
    period: number;
    period_name: string;
    employment: number;
    employee_name: string;
    employee_person_id: number;
    position_name: string;
    department_name: string;
    evaluator: number;
    evaluator_name: string;
    evaluator_id: number;
    final_score: number | null;
    status: 'BOR' | 'ENV' | 'ACE';
    status_display: string;
    feedback_manager: string;
    feedback_employee: string;
    created_at: string;
    updated_at: string;
    details?: ReviewDetail[];
}

export interface EvaluationPeriod {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
    CAL: 'Calidad',
    COM: 'Compromiso',
    CMU: 'Comunicación',
    ORG: 'Organización',
    DIS: 'Disciplina',
    PRO: 'Proactividad',
};

export const CATEGORY_COLORS: Record<string, string> = {
    CAL: 'bg-blue-500',
    COM: 'bg-green-500',
    CMU: 'bg-purple-500',
    ORG: 'bg-yellow-500',
    DIS: 'bg-red-500',
    PRO: 'bg-cyan-500',
};
