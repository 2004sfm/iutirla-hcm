"use client";

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, MapPin, Calendar, Building2, Users, CheckCircle, XCircle, Edit, LayoutGrid, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobKanbanBoard } from '@/components/ats/JobKanbanBoard';
import { JobCandidatesGrid } from '@/components/ats/JobCandidatesGrid';
import apiClient from '@/lib/api-client';

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface PositionFunction {
    id: number;
    description: string;
    order: number;
}

interface PositionRequirement {
    id: number;
    description: string;
    is_mandatory: boolean;
    order: number;
}

interface JobPosting {
    id: number;
    title: string;
    description: string;
    location: string | null;
    position: number;
    position_title: string | null;
    position_objective: string | null;
    department_name: string | null;
    status: string;
    published_date: string | null;
    closing_date: string | null;
    candidates_count: number;
    ask_education: boolean;
    position_functions: PositionFunction[];
    position_requirements: PositionRequirement[];
}

const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    PUBLISHED: "bg-green-100 text-green-800",
    CLOSED: "bg-red-100 text-red-800",
    FROZEN: "bg-blue-100 text-blue-800",
};

const statusLabels = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    CLOSED: "Cerrada",
    FROZEN: "Congelada",
};

export default function JobDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const { data: job, error, isLoading } = useSWR<JobPosting>(
        id ? `/api/ats/jobs/${id}/` : null,
        fetcher
    );

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Cargando vacante...</p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>No se pudo cargar la vacante</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Global */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                <div className="flex flex-col items-center sm:items-start">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                        <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                            {statusLabels[job.status as keyof typeof statusLabels]}
                        </Badge>
                    </div>
                    <div className="flex items-center text-muted-foreground mt-1 gap-4 text-sm">
                        <span className="flex items-center"><Briefcase className="h-3 w-3 mr-2" /> {job.position_title}</span>
                        <span className="flex items-center"><Building2 className="h-3 w-3 mr-2" /> {job.department_name || "-"}</span>
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-2" /> {job.location || "-"}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Link href="/admin/ats/jobs">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                    <Link href={`/admin/ats/jobs/${id}/edit`}>
                        <Button>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="info" className="flex-1 flex flex-col">
                <TabsList className="w-full flex flex-col min-[24rem]:grid min-[24rem]:grid-cols-1 md:grid-cols-3 h-auto p-1 bg-muted/50 gap-1">
                    <TabsTrigger
                        value="info"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <Info className="mr-1 size-4" />
                        Información
                    </TabsTrigger>
                    <TabsTrigger
                        value="candidates"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <Users className="mr-1 size-4" />
                        Candidatos
                    </TabsTrigger>
                    <TabsTrigger
                        value="board"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <LayoutGrid className="mr-1 size-4" />
                        Tablero
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6">
                    <TabsContent value="info" className="space-y-6 m-0">
                        {/* Summary Cards */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardContent className="pt-6 flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Users className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Candidatos</p>
                                        <p className="text-2xl font-bold">{job.candidates_count}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {job.published_date && (
                                <Card className="md:col-span-2">
                                    <CardContent className="pt-6 flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Publicada: {new Date(job.published_date).toLocaleDateString("es-ES")}</span>
                                        </div>
                                        {job.closing_date && (
                                            <span>Cierre: {new Date(job.closing_date).toLocaleDateString("es-ES")}</span>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Objetivo */}
                        {job.position_objective && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Objetivo del Cargo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{job.position_objective}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Descripción */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Descripción de la Vacante</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                            </CardContent>
                        </Card>

                        {/* Funciones */}
                        {job.position_functions && job.position_functions.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Funciones del Cargo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {job.position_functions
                                            .sort((a, b) => a.order - b.order)
                                            .map((func) => (
                                                <li key={func.id} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                                                    <span>{func.description}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Requisitos */}
                        {job.position_requirements && job.position_requirements.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Requisitos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {job.position_requirements
                                            .sort((a, b) => a.order - b.order)
                                            .map((req) => (
                                                <li key={req.id} className="flex items-start gap-3">
                                                    {req.is_mandatory ? (
                                                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                    )}
                                                    <div>
                                                        <span>{req.description}</span>
                                                        {req.is_mandatory && (
                                                            <Badge variant="destructive" className="ml-2">Obligatorio</Badge>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="candidates" className="m-0">
                        <JobCandidatesGrid jobId={id} />
                    </TabsContent>

                    <TabsContent value="board" className="m-0">
                        <JobKanbanBoard jobId={id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
