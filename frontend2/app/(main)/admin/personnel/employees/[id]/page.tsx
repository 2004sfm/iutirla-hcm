"use client";

import { use, useEffect } from "react";
import useSWR from "swr";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, Calendar, UserCheck, Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api-client";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const { setLabel } = useBreadcrumb();
    const { data: employment, error, isLoading } = useSWR(`/api/employment/employments/${id}/`, fetcher);

    useEffect(() => {
        if (employment) {
            const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            setLabel(normalizedPath, employment.person_full_name);
        }
    }, [employment, pathname, setLabel]);

    if (isLoading) return <EmployeeDetailSkeleton />;
    if (error || !employment) return <EmployeeError router={router} />;

    const getStatusVariant = (status: string) => {
        if (status === "ACT") return "default";
        if (status === "TER") return "destructive";
        return "secondary";
    };

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                        {/* Assuming person object is nested or we fetch it separately, but serializer gives names. 
                            For now, we use initials if no photo available in this serializer */}
                        <AvatarFallback className="text-xl">
                            {employment.person_full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{employment.person_full_name}</h1>
                        <div className="flex items-center text-muted-foreground mt-1 gap-2">
                            <Badge variant={getStatusVariant(employment.current_status) as any}>
                                {employment.current_status_display}
                            </Badge>
                            <span className="text-sm">• {employment.role_display}</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>

            {/* Content - Single View (No Tabs) */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Column 1: Position & Org Data */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                Información del Cargo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow label="Cargo" value={employment.position_full_name} />
                            <InfoRow label="Departamento" value={employment.department_name} />
                            <InfoRow label="Tipo de Empleo" value={employment.employment_type_display} />

                            {employment.supervisor_info ? (
                                <div className="pt-2 border-t mt-2">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Supervisor Inmediato</p>
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                        <span>{employment.supervisor_info.name}</span>
                                        <span className="text-xs text-muted-foreground">({employment.supervisor_info.position})</span>
                                    </div>
                                </div>
                            ) : (
                                <InfoRow label="Supervisor" value="No asignado" />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Fechas Importantes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow label="Fecha de Contratación" value={employment.hire_date} />
                            <InfoRow label="Fecha de Finalización" value={employment.end_date || "Indefinido"} />
                            {/* Calculate tenure here if needed */}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: History & Other */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Historial de Estatus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-muted ml-2 space-y-6">
                                {employment.status_logs && employment.status_logs.length > 0 ? (
                                    employment.status_logs.map((log: any, index: number) => (
                                        <div key={log.id} className="ml-4 relative">
                                            <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.status_name}</span>
                                                <span className="text-xs text-muted-foreground">{log.start_date} {log.end_date ? ` - ${log.end_date}` : '(Actual)'}</span>
                                                {log.comments && <p className="text-xs text-muted-foreground mt-1 italic">"{log.comments}"</p>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground ml-4">No hay historial disponible.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value || "-"}</span>
        </div>
    );
}

function EmployeeDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        </div>
    );
}

function EmployeeError({ router }: { router: any }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar la información del empleado.</p>
            <Button onClick={() => router.back()}>Volver</Button>
        </div>
    );
}
