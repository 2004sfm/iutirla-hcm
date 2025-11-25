'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { CatalogHeader } from "@/components/CatalogHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, Building2, Calendar, ChevronRight } from "lucide-react";

interface MyTeam {
    dept_id: number;
    dept_name: string;
    dept_description: string;
    my_position: string;
    start_date: string;
}

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<MyTeam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/employment/employments/my_departments/')
            .then(res => setTeams(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            {/* <CatalogHeader items={[{ name: "Mi Organización", href: "/teams" }]} hideSidebarTrigger /> */}

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-slate-50/50 dark:bg-slate-950 min-h-full">

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Equipos</h1>
                    <p className="text-muted-foreground">Departamentos y áreas donde colaboras actualmente.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-medium">Sin asignación activa</h3>
                        <p className="text-muted-foreground">No tienes contratos activos asociados a un departamento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team, index) => (
                            <Card
                                key={index}
                                className="group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-indigo-500 flex flex-col"
                                onClick={() => router.push(`/teams/${team.dept_id}`)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg mb-3 w-fit">
                                            <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                                        {team.dept_name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {/* Asegúrate de que el backend envíe dept_description o usa un fallback */}
                                        {team.dept_description || "Departamento de la organización."}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    {/* AQUÍ SE MUESTRA EL CARGO */}
                                    <div className="flex items-center gap-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-700 dark:text-slate-300">
                                        <Briefcase className="h-4 w-4 shrink-0" />
                                        <span className="truncate" title={team.my_position}>
                                            {team.my_position}
                                        </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {/* Manejo seguro de fecha */}
                                        <span>Desde: {team.start_date ? new Date(team.start_date).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-indigo-500 transition-colors" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}