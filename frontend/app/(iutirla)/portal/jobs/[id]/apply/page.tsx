"use client";

import { useState, useEffect } from "react";
import ApplicationForm from "@/components/iutirla/ApplicationForm";
import { Loader2, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ApplyPage() {
    const params = useParams();
    const router = useRouter();
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
                    <p className="mt-4 text-slate-600">Cargando información...</p>
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

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <Link
                        href={`/portal/jobs/${job.id}`}
                        className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-blue-600"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Volver a detalles de la vacante
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Postulación a {job.title}
                    </h1>
                    <p className="text-slate-600">
                        Completa el formulario para aplicar a esta posición
                    </p>
                </div>

                <ApplicationForm
                    jobId={job.id}
                    askEducation={job.ask_education}
                />
            </div>
        </div>
    );
}
