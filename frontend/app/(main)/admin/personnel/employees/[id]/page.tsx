'use client';

import { use, useEffect, useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { EmployeeForm } from "@/components/EmployeeForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import apiClient from '@/lib/apiClient';

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const employeeId = parseInt(resolvedParams.id);

    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbItems: BreadcrumbItemType[] = [
        { name: "Panel de Control", href: "/admin/dashboard" },
        { name: "Gestión de Personal", href: "/admin/personnel" },
        { name: "Empleados", href: "/admin/personnel/employees" },
        { name: "Editar Contrato", href: `/admin/personnel/employees/${employeeId}` },
    ];

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                // Obtenemos los datos del empleado (el backend ya usa el serializer que hicimos)
                const response = await apiClient.get(`/api/employment/employments/${employeeId}/`);
                setInitialData(response.data);
            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la información del contrato.");
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            fetchEmployee();
        }
    }, [employeeId]);

    if (loading) {
        return (
            <>
                <CatalogHeader items={breadcrumbItems} />
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Skeleton className="h-12 w-1/2" />
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <CatalogHeader items={breadcrumbItems} />
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    <div className="max-w-4xl mx-auto">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="max-w-4xl mx-auto">
                    <EmployeeForm employmentId={employeeId} initialData={initialData} />
                </div>
            </div>
        </>
    );
}