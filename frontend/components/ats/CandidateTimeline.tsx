"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Circle, CheckCircle2, AlertCircle, User, History } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/card";

interface Log {
    id: number;
    user_name: string;
    action: string;
    details: string;
    timestamp: string;
}

export function CandidateTimeline({ candidateId }: { candidateId: number }) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [candidateId]);

    async function loadLogs() {
        try {
            const res = await apiClient.get(`/api/ats/candidates/${candidateId}/logs/`);
            setLogs(res.data);
        } catch (error) {
            console.error("Error loading logs:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <History className="h-8 w-8 mb-2 opacity-50" />
                <p>No hay actividad registrada.</p>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {logs.map((log, index) => (
                <div key={log.id} className="flex gap-4 group">
                    {/* Timeline Line & Dot */}
                    <div className="flex flex-col items-center min-w-[24px]">
                        <div className={`w-px bg-slate-200 flex-1 ${index === 0 ? 'opacity-0' : ''}`} />
                        <div className="relative flex items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                        </div>
                        <div className={`w-px bg-slate-200 flex-1 ${index === logs.length - 1 ? 'opacity-0' : ''}`} />
                    </div>

                    {/* Content */}
                    <div className="pb-8 pt-1 flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900">
                                {getActionLabel(log.action)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(log.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{log.details}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="h-3 w-3" />
                            <span>{log.user_name}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
        'STAGE_CHANGE': 'Cambio de Etapa',
        'HIRED': 'Contratado',
        'UPDATE': 'Actualización',
        'NOTE_ADDED': 'Nota Agregada',
        'CREATED': 'Creado',
    };
    return labels[action] || action;
}
