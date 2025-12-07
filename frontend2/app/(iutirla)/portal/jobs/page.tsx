"use client";

import { useState, useEffect } from "react";
import JobCard from "@/components/iutirla/JobCard";
import { Search, Briefcase, Loader2 } from "lucide-react";

export default function JobsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadJobs() {
            try {
                const res = await fetch("http://localhost:8000/api/ats/public/jobs/");

                if (!res.ok) {
                    throw new Error("Failed to fetch jobs");
                }

                const data = await res.json();
                setJobs(data.results || data);
            } catch (error) {
                console.error("Error fetching jobs:", error);
                setJobs([]);
            } finally {
                setLoading(false);
            }
        }

        loadJobs();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-brand-primary" />
                    <p className="mt-4 text-slate-600">Cargando vacantes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="mb-4 text-4xl font-bold text-slate-900 md:text-5xl">
                    Vacantes Disponibles
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-slate-600">
                    Explora nuestras oportunidades de carrera y encuentra el puesto perfecto para ti
                </p>
            </div>

            {/* Search Bar (decorativo por ahora) */}
            <div className="mx-auto mb-12 max-w-2xl">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cargo o departamento..."
                        className="w-full rounded-full border border-slate-300 py-4 pl-12 pr-4 shadow-sm transition-all focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
            </div>

            {/* Jobs Grid */}
            {jobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map((job: any) => (
                        <JobCard
                            key={job.id}
                            id={job.id}
                            title={job.title}
                            departmentName={job.department_name}
                            location={job.location}
                            salaryRange={job.salary_range}
                            positionTitle={job.position_title}
                            publishedDate={job.published_date}
                            closingDate={job.closing_date}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Briefcase className="mb-4 h-16 w-16 text-slate-300" />
                    <h2 className="mb-2 text-2xl font-semibold text-slate-700">
                        No hay vacantes disponibles en este momento
                    </h2>
                    <p className="text-slate-500">
                        Vuelve pronto para ver nuevas oportunidades
                    </p>
                </div>
            )}
        </div>
    );
}
