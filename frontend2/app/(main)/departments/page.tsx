"use client";

import useSWR from "swr";
import { Building2, Loader2 } from "lucide-react";
import { DepartmentCard } from "@/components/departments/department-card";
import apiClient from "@/lib/api-client";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface Department {
    id: number;
    name: string;
    manager: {
        name: string;
        position: string;
    } | null;
    user_position: string;
}

export default function DepartmentsPage() {
    const { data: departments, error, isLoading } = useSWR<Department[]>(
        "/api/organization/departments/my_departments/",
        fetcher
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">Error al cargar los departamentos</p>
            </div>
        );
    }

    if (!departments || departments.length === 0) {
        return (
            <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center justify-between border-b pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Departamentos</h1>
                        <p className="text-muted-foreground mt-1">
                            Explora los departamentos donde trabajas
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg">
                    <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes departamentos asignados</h3>
                    <p className="text-muted-foreground">
                        Contacta a recursos humanos para más información
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Departamentos</h1>
                    <p className="text-muted-foreground mt-1">
                        Explora los departamentos donde trabajas
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <DepartmentCard
                        key={dept.id}
                        department={dept}
                        href={`/departments/${dept.id}`}
                    />
                ))}
            </div>
        </div>
    );
}
