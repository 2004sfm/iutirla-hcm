"use client";

import { use, useEffect } from "react";
import useSWR from "swr";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Briefcase, Users, UserCheck, Building2, ListChecks, ScrollText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import apiClient from "@/lib/api-client";
import { useBreadcrumb } from "@/context/breadcrumb-context";

// Interfaces matching backend serializer
interface PositionRequirement {
    id: number;
    description: string;
}

interface PositionFunction {
    id: number;
    description: string;
}

interface Position {
    id: number;
    department_name: string;
    job_title_name: string;
    full_name: string;
    vacancies: number;
    active_employees_count: number;
    reports_to_names_display: string;
    requirements: PositionRequirement[];
    functions: PositionFunction[];
    objective?: string;
}

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function PositionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const { setLabel } = useBreadcrumb();
    const { data: position, error, isLoading } = useSWR<Position>(`/api/organization/positions/${id}/`, fetcher);

    useEffect(() => {
        if (position) {
            // Normalize path by removing trailing slash if present to match DynamicBreadcrumbs key generation
            const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            setLabel(normalizedPath, position.job_title_name);
        }
    }, [position, pathname, setLabel]);

    if (isLoading) {
        return <PositionDetailSkeleton />;
    }

    if (error || !position) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">No se pudo cargar la información del cargo.</p>
                <Button onClick={() => router.back()}>Volver</Button>
            </div>
        );
    }

    // Configuration for Functions Catalog
    const functionsFields: CatalogField[] = [
        { name: "description", label: "Descripción", type: "textarea", required: true },
    ];
    const functionsColumns: ColumnDef<PositionFunction>[] = [
        { accessorKey: "description", header: "Descripción", cell: ({ row }) => <div className="whitespace-pre-wrap">{row.getValue("description")}</div> },
    ];

    // Configuration for Requirements Catalog
    const requirementsFields: CatalogField[] = [
        { name: "description", label: "Descripción", type: "textarea", required: true },
    ];
    const requirementsColumns: ColumnDef<PositionRequirement>[] = [
        { accessorKey: "description", header: "Descripción", cell: ({ row }) => <div className="whitespace-pre-wrap">{row.getValue("description")}</div> },
    ];

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{position.job_title_name}</h1>
                    <div className="flex items-center text-muted-foreground mt-1">
                        <Building2 className="h-4 w-4 mr-2" />
                        <span>{position.department_name}</span>
                    </div>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr size-4" />
                </Button>
            </div>

            <Tabs defaultValue="general" className="flex-1 flex flex-col">
                <TabsList className="w-full flex flex-col md:grid md:grid-cols-3 h-auto p-1 bg-muted/50 gap-1">
                    <TabsTrigger
                        value="general"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <Briefcase className="mr-1 size-4" />
                        <p className="truncate">
                            Información General
                        </p>
                    </TabsTrigger>
                    <TabsTrigger
                        value="functions"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <ListChecks className="mr-1 size-4" />
                        <p className="truncate">
                            Funciones
                        </p>
                    </TabsTrigger>
                    <TabsTrigger
                        value="requirements"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <ScrollText className="mr-1 size-4" />
                        <p className="truncate">
                            Requisitos
                        </p>
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6">
                    <TabsContent value="general" className="m-0 h-full">
                        <div className="flex flex-col gap-6 w-full">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" />
                                        Objetivo del Cargo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {position.objective || "No se ha definido un objetivo para este cargo."}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <UserCheck className="h-5 w-5 text-primary" />
                                        Jerarquía
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Reporta a:</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {position.reports_to_names_display || "Posición de mayor jerarquía"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Ocupación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Vacantes Totales</span>
                                        <span className="text-sm font-bold">{position.vacancies}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Ocupadas</span>
                                        <span className="text-sm font-bold">{position.active_employees_count}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Disponibles</span>
                                        <span className="text-sm font-bold">
                                            {Math.max(0, position.vacancies - position.active_employees_count)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="functions" className="m-0 h-full">
                        <CatalogCRUD
                            title=""
                            apiUrl={`/api/organization/positions/${id}/functions/`}
                            fields={functionsFields}
                            columns={functionsColumns}
                            searchKey="description"
                        />
                    </TabsContent>

                    <TabsContent value="requirements" className="m-0 h-full">
                        <CatalogCRUD
                            title=""
                            apiUrl={`/api/organization/positions/${id}/requirements/`}
                            fields={requirementsFields}
                            columns={requirementsColumns}
                            searchKey="description"
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function PositionDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-6">
                    <Skeleton className="h-[300px] w-full" />
                </div>
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </div>
        </div>
    );
}
