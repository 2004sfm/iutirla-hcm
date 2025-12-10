"use client";

import { useState } from "react";
import useSWR from "swr";
import apiClient from "@/lib/api-client";
import {
    Briefcase,
    Calendar,
    User,
    Target,
    ListChecks,
    Building2,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Interfaces based on backend response
interface SupervisorInfo {
    id: number | null;
    name: string;
    position: string;
}

interface EmploymentData {
    id: number;
    person_full_name: string;
    person_document: string;
    position_full_name: string;
    department_name: string;
    hire_date: string;
    current_status_display: string;
    supervisor_info: SupervisorInfo | null;
    position_objective: string | null;
    position_functions: string[];
}

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function JobDataPage() {
    const { data: employments, error, isLoading } = useSWR<EmploymentData[]>(
        "/api/employment/employments/my_position_data/",
        fetcher
    );

    const [selectedEmploymentId, setSelectedEmploymentId] = useState<string | undefined>(undefined);

    // Determines the currently selected employment
    const selectedEmployment = employments?.find(
        (emp) => emp.id.toString() === selectedEmploymentId
    ) || employments?.[0];

    // Update selected ID when data loads if not already set
    if (employments && employments.length > 0 && !selectedEmploymentId) {
        setSelectedEmploymentId(employments[0].id.toString());
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full items-center justify-center space-y-4">
                <p className="text-muted-foreground">Error cargando datos del puesto.</p>
            </div>
        );
    }

    if (!employments || employments.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center space-y-4">
                <Briefcase className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Sin Puesto Asignado</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                    No se encontraron contratos activos asociados a tu perfil.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Datos del Puesto</h1>
                    <p className="text-muted-foreground mt-1">
                        Información detallada de tu cargo y funciones
                    </p>
                </div>

                {/* Position Selector (only if multiple) */}
                {employments.length > 1 && (
                    <div className="w-full sm:w-auto">
                        <Select
                            value={selectedEmploymentId}
                            onValueChange={setSelectedEmploymentId}
                        >
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Selecciona un puesto" />
                            </SelectTrigger>
                            <SelectContent>
                                {employments.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                        {emp.position_full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {selectedEmployment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 1. General Info Card */}
                    <Card className="col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                Información General
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Cargo</span>
                                <p className="font-semibold text-lg">{selectedEmployment.position_full_name}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Departamento</span>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">{selectedEmployment.department_name}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Fecha de Ingreso</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">{selectedEmployment.hire_date}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Estatus</span>
                                <div>
                                    <Badge variant={selectedEmployment.current_status_display === 'Activo' ? 'default' : 'secondary'}>
                                        {selectedEmployment.current_status_display}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Supervisor Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Reporta a (Jefe Inmediato)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedEmployment.supervisor_info ? (
                                <div className="flex flex-col space-y-3">
                                    {selectedEmployment.supervisor_info.name === "VACANTE" ? (
                                        <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                                            <p className="font-medium text-muted-foreground">Posición Vacante</p>
                                            <p className="text-sm text-muted-foreground">{selectedEmployment.supervisor_info.position}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">Nombre</span>
                                                <p className="font-medium">{selectedEmployment.supervisor_info.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">Cargo</span>
                                                <p className="font-medium">{selectedEmployment.supervisor_info.position}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No se ha asignado un supervisor.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Objective */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Objetivo del Cargo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedEmployment.position_objective ? (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {selectedEmployment.position_objective}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No definido.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 4. Functions (Full Width) */}
                    <Card className="col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListChecks className="h-5 w-5 text-primary" />
                                Funciones y Responsabilidades
                            </CardTitle>
                            <CardDescription>
                                Actividades principales asignadas a este puesto
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedEmployment.position_functions && selectedEmployment.position_functions.length > 0 ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pl-5 list-disc">
                                    {selectedEmployment.position_functions.map((func, index) => (
                                        <li key={index} className="text-sm text-muted-foreground pl-1">
                                            <span className="text-foreground/90">{func}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-muted/20 rounded-lg">
                                    <ListChecks className="h-8 w-8 mb-2 opacity-50" />
                                    <p>No hay funciones registradas para este cargo.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            )}
        </div>
    );
}
