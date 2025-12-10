"use client";

import useSWR from "swr";
import { Loader2, Building2 } from "lucide-react";
import apiClient from "@/lib/api-client";
import { OrganizationOrgChart, DepartmentNodeData } from "@/components/departments/organization-org-chart";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function OrgChartPage() {
    const { data: departments, error, isLoading } = useSWR<DepartmentNodeData[]>(
        "/api/organization/departments/institutional_chart/",
        fetcher
    );

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Error al cargar el organigrama. Por favor, intente nuevamente.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Organigrama Institucional</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualiza la estructura jerárquica de todos los departamentos
                    </p>
                </div>
            </div>

            <div className="flex-1 bg-slate-50/50 rounded-lg border p-4 min-h-[500px]">
                {departments && departments.length > 0 ? (
                    <OrganizationOrgChart departments={departments} />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No hay departamentos registrados.
                    </div>
                )}
            </div>
        </div>
    );
}
