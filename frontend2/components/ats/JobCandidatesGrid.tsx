"use client";

import useSWR from "swr";
import { CandidateCard } from "./KanbanComponents";
import { Candidate } from "@/types/ats";
import apiClient from "@/lib/api-client";
import { Users } from "lucide-react";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

interface JobCandidatesGridProps {
    jobId: string | number;
}

export function JobCandidatesGrid({ jobId }: JobCandidatesGridProps) {
    const { data: candidates, error, isLoading } = useSWR<Candidate[]>(
        `/api/ats/candidates/?job_posting=${jobId}`,
        fetcher
    );

    if (isLoading) {
        return <div className="py-8 text-center text-muted-foreground">Cargando candidatos...</div>;
    }

    if (error) {
        return <div className="py-8 text-center text-red-500">Error al cargar candidatos</div>;
    }

    if (!candidates || candidates.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay candidatos</p>
                <p className="text-sm mt-2">Esta vacante aún no tiene postulaciones registradas</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {candidates.map((candidate) => (
                <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                // No pasamos acciones de mover aquí, pero podríamos
                />
            ))}
        </div>
    );
}
