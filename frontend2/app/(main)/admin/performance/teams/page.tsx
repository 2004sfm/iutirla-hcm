"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ClipboardCheck, TrendingUp, AlertCircle } from "lucide-react";
import apiClient from "@/lib/api-client";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface TeamMember {
    id: number;
    employee_name: string;
    employee_person_id: number;
    position_name: string;
    department_name: string;
    period_name: string;
    final_score: number | null;
    status: string;
    status_display: string;
}

interface TeamSummary {
    dept_id: number | null;
    dept_name: string | null;
    total: number;
    pending: number;
}

export default function TeamsPage() {
    const [selectedDept, setSelectedDept] = useState<string>("all");

    // Fetch team summary (departments with stats)
    const { data: teams } = useSWR<TeamSummary[]>(
        "/api/performance/reviews/my_teams_summary/",
        fetcher
    );

    // Fetch reviews for selected department
    const { data: reviews, isLoading } = useSWR<TeamMember[]>(
        selectedDept === "all"
            ? "/api/performance/reviews/?scope=given"
            : `/api/performance/reviews/?scope=given&department=${selectedDept}`,
        fetcher
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "BOR": return "bg-yellow-100 text-yellow-800";
            case "ENV": return "bg-green-100 text-green-800";
            case "ACE": return "bg-blue-100 text-blue-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "text-gray-500";
        if (score >= 4.5) return "text-green-600";
        if (score >= 3.5) return "text-yellow-600";
        return "text-red-600";
    };

    const totalTeamMembers = teams?.reduce((acc, team) => acc + team.total, 0) || 0;
    const totalPending = teams?.reduce((acc, team) => acc + team.pending, 0) || 0;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-8 h-8" />
                    Mis Equipos
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona y evalúa el desempeño de tus subordinados
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Empleados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTeamMembers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            En todos los departamentos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Evaluaciones Pendientes</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Por completar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {totalTeamMembers - totalPending}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Evaluaciones finalizadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Department Tabs */}
            <Tabs value={selectedDept} onValueChange={setSelectedDept} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    {teams?.map((team) => (
                        <TabsTrigger key={team.dept_id || "no-dept"} value={String(team.dept_id || "0")}>
                            {team.dept_name || "Sin Departamento"} ({team.total})
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={selectedDept} className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Cargando equipo...</p>
                        </div>
                    ) : reviews && reviews.length > 0 ? (
                        <div className="grid gap-4">
                            {reviews.map((member) => (
                                <Card key={member.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{member.employee_name}</h3>
                                                    <Badge className={getStatusColor(member.status)}>
                                                        {member.status_display}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{member.position_name}</p>
                                                <p className="text-xs text-muted-foreground">{member.department_name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Período: {member.period_name}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {member.final_score !== null && (
                                                    <div className="text-center">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                                            <span className={`text-2xl font-bold ${getScoreColor(member.final_score)}`}>
                                                                {member.final_score.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Promedio</p>
                                                    </div>
                                                )}

                                                <Link href={`/admin/performance/reviews/${member.id}/edit`}>
                                                    <Button
                                                        variant={member.status === "BOR" ? "default" : "outline"}
                                                        className={member.status === "BOR" ? "bg-brand-primary hover:bg-brand-primary/90" : ""}
                                                    >
                                                        {member.status === "BOR" ? "Evaluar" : "Ver Detalles"}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No hay empleados en este departamento</h3>
                                <p className="text-muted-foreground text-sm">
                                    No se encontraron evaluaciones para el departamento seleccionado.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
