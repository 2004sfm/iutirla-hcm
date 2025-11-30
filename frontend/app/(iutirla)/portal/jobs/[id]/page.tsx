"use client";

import { useState, useEffect } from "react";
import ApplicationForm from "@/components/iutirla/ApplicationForm";
import { MapPin, DollarSign, Calendar, Briefcase, Target, CheckCircle2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function JobDetailPage() {
    const params = useParams();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function loadJob() {
            try {
                const res = await fetch(`http://localhost:8000/api/ats/public/jobs/${params.id}/`);

                if (!res.ok) {
                    setError(true);
                    return;
                }

                const data = await res.json();
                setJob(data);
            } catch (err) {
                console.error("Error fetching job:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            loadJob();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                    <p className="mt-4 text-slate-600">Cargando vacante...</p>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Vacante no encontrada</h1>
                    <Link href="/portal/jobs" className="mt-4 inline-block text-blue-600 hover:underline">
                        Volver a vacantes
                    </Link>
                </div>
            </div>
        );
    }

    const formattedPublished = job.published_date
        ? new Date(job.published_date).toLocaleDateString("es-VE", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "";

    const formattedClosing = job.closing_date
        ? new Date(job.closing_date).toLocaleDateString("es-VE", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : null;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white shadow-xl">
                    <h1 className="mb-4 text-4xl font-bold">{job.title}</h1>
                    <div className="flex flex-wrap gap-4 text-blue-100">
                        {job.department_name && (
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                <span>{job.department_name}</span>
                            </div>
                        )}
                        {job.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                <span>{job.location}</span>
                            </div>
                        )}
                        {job.salary_range && (
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                <span>{job.salary_range}</span>
                            </div>
                        )}
                    </div>
                    {formattedPublished && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-blue-200">
                            <Calendar className="h-4 w-4" />
                            <span>Publicado: {formattedPublished}</span>
                            {formattedClosing && (
                                <>
                                    <span className="mx-2">•</span>
                                    <span>Cierra: {formattedClosing}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="rounded-xl bg-white p-8 shadow-md">
                            <h2 className="mb-4 text-2xl font-bold text-slate-900">
                                Descripción del Puesto
                            </h2>
                            <div className="prose max-w-none text-slate-600">
                                <p className="whitespace-pre-wrap">{job.description}</p>
                            </div>
                        </div>

                        {/* Objectives */}
                        {job.position_objectives && job.position_objectives.length > 0 && (
                            <div className="rounded-xl bg-white p-8 shadow-md">
                                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
                                    <Target className="h-6 w-6 text-blue-600" />
                                    Objetivos de la Posición
                                </h2>
                                <ul className="space-y-2">
                                    {job.position_objectives.map((objective: string, index: number) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                                            <span className="text-slate-700">{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Requirements */}
                        {job.position_requirements && job.position_requirements.length > 0 && (
                            <div className="rounded-xl bg-white p-8 shadow-md">
                                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
                                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                                    Requisitos
                                </h2>
                                <ul className="space-y-2">
                                    {job.position_requirements.map((requirement: string, index: number) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                                            <span className="text-slate-700">{requirement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Application CTA Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 text-xl font-bold text-slate-900">
                                ¿Te interesa esta posición?
                            </h3>
                            <p className="mb-6 text-sm text-slate-600">
                                Si cumples con los requisitos y te apasiona el reto, ¡queremos conocerte!
                            </p>
                            <Link
                                href={`/portal/jobs/${job.id}/apply`}
                                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                Postularme Ahora
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
