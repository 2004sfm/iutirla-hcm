"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Building2, ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";

interface PositionFunction {
    id: number;
    description: string;
    order: number;
}

interface PositionRequirement {
    id: number;
    description: string;
    order: number;
}

interface JobPosting {
    id: number;
    title: string;
    description: string;
    location: string | null;
    position_title: string | null;
    position_objective: string | null;
    department_name: string | null;
    published_date: string | null;
    closing_date: string | null;
    status: string;
    ask_education: boolean;
    position_functions: PositionFunction[];
    position_requirements: PositionRequirement[];
}

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        fetch(`http://localhost:8000/api/ats/public/jobs/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Vacante no encontrada");
                return res.json();
            })
            .then((data) => {
                setJob(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                <div className="container mx-auto px-4 py-16 text-center">
                    <p className="text-xl">Cargando...</p>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Vacante no encontrada</h1>
                    <p className="text-muted-foreground mb-8">{error}</p>
                    <Link href="/jobs">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a vacantes
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-brand-primary text-white py-12">
                <div className="container mx-auto px-4">
                    <Link href="/portal/jobs">
                        <Button variant="ghost" className="text-white hover:bg-white/10 mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a vacantes
                        </Button>
                    </Link>

                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-white/10 rounded-lg">
                            <Briefcase className="w-12 h-12" />
                        </div>
                        <div className="flex-1">
                            <Badge className="bg-white/20 hover:bg-white/30 mb-3">
                                {job.position_title || "Posición"}
                            </Badge>
                            <h1 className="text-4xl font-bold mb-2">{job.title}</h1>

                            <div className="flex flex-wrap gap-4 text-brand-primary-foreground/90 mt-4">
                                {job.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        <span>{job.location}</span>
                                    </div>
                                )}
                                {job.published_date && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        <span>Publicado: {new Date(job.published_date).toLocaleDateString("es-ES")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Descripción del Puesto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-base leading-relaxed">
                                        {job.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Objective */}
                        {job.position_objective && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Objetivo del Cargo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap text-base leading-relaxed">
                                        {job.position_objective}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Functions */}
                        {job.position_functions && job.position_functions.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Funciones del Cargo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {job.position_functions
                                            .sort((a, b) => a.order - b.order)
                                            .map((func) => (
                                                <li key={func.id} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand-primary mt-2 shrink-0" />
                                                    <span className="text-base">{func.description}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Requirements */}
                        {job.position_requirements && job.position_requirements.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Requisitos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {job.position_requirements
                                            .sort((a, b) => a.order - b.order)
                                            .map((req) => (
                                                <li key={req.id} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                                                    <span className="text-base">{req.description}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Vacante</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {job.closing_date && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Cierre</p>
                                        <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                                            {new Date(job.closing_date).toLocaleDateString("es-ES", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                )}

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Estado</p>
                                    <Badge className="bg-green-600">Activa</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>¿Listo para postularte?</CardTitle>
                                <CardDescription>
                                    Envía tu CV y únete a nuestro equipo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/portal/jobs/${id}/apply`}>
                                    <Button className="w-full bg-brand-primary hover:bg-brand-primary/90" size="lg">
                                        Postularme Ahora
                                    </Button>
                                </Link>

                                <p className="text-xs text-muted-foreground mt-4 text-center">
                                    Al postularte, aceptas compartir tu información con IUTIRLA
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted">
                            <CardHeader>
                                <CardTitle className="text-base">¿Necesitas ayuda?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">IUTIRLA - Extensión Porlamar</p>
                                        <p className="text-muted-foreground">Recursos Humanos</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-muted-foreground">
                                        Email:{" "}
                                        <a href="mailto:rrhh@iutirla.edu.ve" className="text-brand-primary hover:underline font-medium">
                                            rrhh@iutirla.edu.ve
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
