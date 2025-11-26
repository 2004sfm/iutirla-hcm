'use client';

import { use, useEffect, useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Save, Loader2, Target, ListChecks } from "lucide-react";
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { PositionObjectiveManager } from '@/components/PositionObjectiveManager';
import { PositionRequirementManager } from '@/components/PositionRequirementManager';
import { PositionForm } from '@/components/PositionForm';

interface PositionData {
    id: number;
    job_title: number;
    job_title_name: string;
    department: number;
    department_name: string;
    vacancies: number;
    manager_position: number | null;
    manager_position_name: string | null;
    name: string | null;
}

export default function PositionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const positionId = parseInt(resolvedParams.id);
    const router = useRouter();

    const [positionData, setPositionData] = useState<PositionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("info");

    const breadcrumbItems: BreadcrumbItemType[] = [
        { name: "Organización", href: "/admin/organization" },
        { name: "Posiciones", href: "/admin/organization/positions" },
        { name: "Detalle", href: `/admin/organization/positions/${positionId}` },
    ];

    useEffect(() => {
        const fetchPosition = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get<PositionData>(`/api/organization/positions/${positionId}/`);
                setPositionData(response.data);
            } catch (err) {
                console.error("Error cargando posición:", err);
                setError("No se pudo cargar la posición. Verifique que el registro exista o tenga permisos.");
            } finally {
                setLoading(false);
            }
        };

        if (positionId) {
            fetchPosition();
        }
    }, [positionId]);

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
                <div className="max-w-5xl mx-auto space-y-4">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {positionData?.job_title_name || "Posición"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {positionData?.department_name} · {positionData?.vacancies} vacante(s)
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => router.push('/admin/organization/positions')}>
                            <ArrowLeft className="size-4 mr-2" />
                            Volver
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info" className="gap-2">
                                Información
                            </TabsTrigger>
                            <TabsTrigger value="objectives" className="gap-2">
                                <Target className="size-4" />
                                Objetivos
                            </TabsTrigger>
                            <TabsTrigger value="requirements" className="gap-2">
                                <ListChecks className="size-4" />
                                Requerimientos
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Información */}
                        <TabsContent value="info">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Información de la Posición</CardTitle>
                                    <CardDescription>Edite los detalles básicos de la posición</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {positionData && (
                                        <PositionForm
                                            positionId={positionId}
                                            initialData={{
                                                job_title: positionData.job_title,
                                                department: positionData.department,
                                                vacancies: positionData.vacancies,
                                                manager_position: positionData.manager_position,
                                                name: positionData.name,
                                            }}
                                            onUpdate={async () => {
                                                // Reload position data after update
                                                const response = await apiClient.get<PositionData>(`/api/organization/positions/${positionId}/`);
                                                setPositionData(response.data);
                                            }}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Objetivos */}
                        <TabsContent value="objectives">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Objetivos de la Posición</CardTitle>
                                    <CardDescription>Metas y responsabilidades principales</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PositionObjectiveManager positionId={positionId} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Requerimientos */}
                        <TabsContent value="requirements">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Requerimientos de la Posición</CardTitle>
                                    <CardDescription>Requisitos y competencias necesarias</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PositionRequirementManager positionId={positionId} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </>
    );
}
