import Link from "next/link";
import { MapPin, DollarSign, Briefcase, Calendar, ArrowRight } from "lucide-react";

interface JobCardProps {
    id: number;
    title: string;
    departmentName: string;
    location?: string;
    salaryRange?: string;
    positionTitle?: string;
    publishedDate: string;
    closingDate?: string;
}

export default function JobCard({
    id,
    title,
    departmentName,
    location,
    salaryRange,
    positionTitle,
    publishedDate,
    closingDate,
}: JobCardProps) {
    const formattedPublished = new Date(publishedDate).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const formattedClosing = closingDate
        ? new Date(closingDate).toLocaleDateString("es-VE", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : null;

    return (
        <Link href={`/portal/jobs/${id}`}>
            <div className="group h-full rounded-xl border border-slate-200 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-4">
                    <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Briefcase className="h-4 w-4" />
                        <span>{departmentName}</span>
                        {positionTitle && (
                            <>
                                <span className="text-slate-400">•</span>
                                <span>{positionTitle}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="mb-4 space-y-2">
                    {location && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{location}</span>
                        </div>
                    )}
                    {salaryRange && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>{salaryRange}</span>
                        </div>
                    )}
                </div>

                <div className="mb-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Publicado: {formattedPublished}</span>
                    </div>
                    {formattedClosing && (
                        <div className="flex items-center gap-1">
                            <span>Cierra: {formattedClosing}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 font-semibold text-blue-600 transition-all group-hover:gap-3">
                    Ver detalles
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>
        </Link>
    );
}
