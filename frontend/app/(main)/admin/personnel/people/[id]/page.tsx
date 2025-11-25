'use client';

import { use, useEffect, useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
// Importamos el componente y la interfaz de tipos para evitar 'any'
import { PersonForm, type PersonBackendData } from "@/components/PersonForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import apiClient from '@/lib/apiClient';

export default function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
    // Desempaquetamos los parámetros (Next.js 15+)
    const resolvedParams = use(params);
    const personId = parseInt(resolvedParams.id);

    // Estado con tipado estricto usando la interfaz del formulario
    const [initialData, setInitialData] = useState<PersonBackendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbItems: BreadcrumbItemType[] = [
        { name: "Gestión de Personal", href: "/admin/personnel" },
        { name: "Todas las Personas", href: "/admin/personnel/people" },
        { name: "Editar", href: `/admin/personnel/people/${personId}` },
    ];

    useEffect(() => {
        const fetchPerson = async () => {
            try {
                setLoading(true);
                // La respuesta del API debe coincidir con la estructura de PersonBackendData
                const response = await apiClient.get<PersonBackendData>(`/api/core/persons/${personId}/`);
                setInitialData(response.data);
            } catch (err) {
                console.error("Error cargando persona:", err);
                setError("No se pudo cargar el expediente. Verifique que el registro exista o tenga permisos.");
            } finally {
                setLoading(false);
            }
        };

        if (personId) {
            fetchPerson();
        }
    }, [personId]);

    if (loading) {
        return (
            <>
                <CatalogHeader items={breadcrumbItems} />
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-[400px] w-full rounded-xl" />
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
                    <div className="max-w-5xl mx-auto">
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
                {/* <div className="max-w-5xl mx-auto"> */}
                {/* Renderizamos el formulario en modo edición pasándole el ID y la Data */}
                <PersonForm personId={personId} initialData={initialData} />
                {/* </div> */}
            </div>
        </>
    );
}