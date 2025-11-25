'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
// CAMBIO: Usamos CatalogHeader
import { CatalogHeader } from "@/components/CatalogHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Building2 } from "lucide-react";

interface TeamSummary {
    dept_id: number | null;
    dept_name: string | null;
    total: number;
    pending: number;
}

export default function MyTeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const { data } = await apiClient.get('/api/performance/reviews/my_teams_summary/');
                setTeams(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    return (
        <>
            {/* CAMBIO: CatalogHeader con hideSidebarTrigger opcional */}
            <CatalogHeader
                items={[
                    { name: "Evaluación", href: "#" },
                    { name: "Mis Equipos", href: "/performance/teams" }
                ]}
                hideSidebarTrigger={true} // O true, según tu preferencia de diseño
            />

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-slate-50/50 dark:bg-slate-950 min-h-full">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Equipos</h1>
                    <p className="text-muted-foreground">Seleccione un departamento para realizar las evaluaciones a su cargo.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">
                            No se encontraron equipos asignados. <br />
                            <span className="text-xs">
                                (Verifique que se hayan generado las boletas de evaluación donde usted es el supervisor).
                            </span>
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500"
                                // Si dept_id es null, enviamos 0 para que el backend entienda
                                onClick={() => router.push(`/performance/teams/${team.dept_id ?? 0}`)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Building2 className="h-5 w-5 text-indigo-600" />
                                        {team.dept_name || "Sin Departamento"}
                                    </CardTitle>
                                    <CardDescription>
                                        {team.total} {team.total === 1 ? 'Empleado' : 'Empleados'} a cargo
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mt-2">
                                        <Badge variant={team.pending > 0 ? "destructive" : "outline"}>
                                            {team.pending} Pendientes
                                        </Badge>
                                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                                            Ver lista <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}