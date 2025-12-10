"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, ClipboardCheck, AlertCircle } from "lucide-react";
import apiClient from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
    id: number;
    period_name: string;
    status: string;
    status_display: string;
    final_score: number | null;
    evaluator_name: string;
    position_name: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function PerformancePage() {
    const router = useRouter();

    // Fetch reviews where scope=received (I am the employee)
    const { data: response, isLoading, error } = useSWR<PaginatedResponse<Review>>(
        "/api/performance/reviews/?scope=received",
        fetcher
    );

    const reviews = response?.results || [];

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 space-y-6">
                <Skeleton className="h-12 w-64 mb-6" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </CardTitle>
                        <CardDescription className="text-red-600/80">
                            No se pudieron cargar tus evaluaciones. Por favor intenta más tarde.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mi Desempeño</h1>
                    <p className="text-muted-foreground mt-1">
                        Consulta el historial de tus evaluaciones y retroalimentación recibida
                    </p>
                </div>
            </div>

            {reviews.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <ClipboardCheck className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-900">Sin evaluaciones registradas</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            Aún no tienes evaluaciones de desempeño asignadas para este periodo.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => {
                        const isDraft = review.status === 'BOR';
                        const isSubmitted = review.status === 'ENV';
                        const isAccepted = review.status === 'ACE';

                        const statusColor = isDraft ? "bg-yellow-500 hover:bg-yellow-600"
                            : isSubmitted ? "bg-blue-500 hover:bg-blue-600"
                                : "bg-green-600 hover:bg-green-700";

                        return (
                            <Card key={review.id} className="hover:shadow-lg transition-all duration-200 border-slate-200 group">
                                <CardHeader className="pb-3 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <Badge className={`px-2.5 py-0.5 text-xs font-semibold ${statusColor} text-white border-none`}>
                                            {review.status_display}
                                        </Badge>
                                        {review.final_score && (
                                            <span className="text-2xl font-bold text-slate-800">
                                                {Number(review.final_score).toFixed(1)}
                                                <span className="text-xs text-muted-foreground font-normal ml-0.5">/5</span>
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <CardTitle className="text-xl text-slate-900 group-hover:text-brand-primary transition-colors">
                                            {review.period_name}
                                        </CardTitle>
                                        <CardDescription className="text-slate-500 mt-1 font-medium">
                                            {review.position_name}
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-white text-slate-600 font-bold text-xs">
                                                {review.evaluator_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Evaluador</p>
                                            <p className="text-sm font-medium text-slate-700 truncate" title={review.evaluator_name}>
                                                {review.evaluator_name}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm"
                                        onClick={() => router.push(`/performance/${review.id}`)}
                                    >
                                        Ver Detalles
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
