'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { CatalogHeader } from "@/components/CatalogHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trophy, Calendar, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Review {
    id: number;
    period_name: string;
    evaluator_name: string;
    status: string;
    status_display: string;
    final_score: number | null;
    created_at: string;
}

export default function MyReviewsPage() {
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReviews = async () => {
            try {
                // 🚨 CAMBIO AQUÍ: Agregamos ?scope=received
                const { data } = await apiClient.get('/api/performance/reviews/?scope=received');

                const results = Array.isArray(data) ? data : (data.results || []);
                setReviews(results);
            } catch (error) {
                console.error(error);
                toast.error("No se pudo cargar tu historial.");
            } finally {
                setLoading(false);
            }
        };
        fetchMyReviews();
    }, []);
    // Helper visual
    const getStatusConfig = (status: string, label: string) => {
        switch (status) {
            case 'BOR': return { color: "bg-yellow-100 text-yellow-800", icon: Clock, text: "En proceso por Supervisor" };
            case 'ENV': return { color: "bg-blue-100 text-blue-800", icon: CheckCircle2, text: "Lista para tu revisión" };
            case 'ACE': return { color: "bg-green-100 text-green-800", icon: Trophy, text: "Finalizada" };
            default: return { color: "bg-gray-100", icon: Clock, text: label };
        }
    };

    return (
        <>
            {/* <CatalogHeader items={[
                { name: "Inicio", href: "/" },
                { name: "Mis Evaluaciones", href: "/performance/my-reviews" }
            ]} hideSidebarTrigger /> */}

            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-slate-50/50 dark:bg-slate-950">

                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Mi Desempeño</h1>
                    <p className="text-muted-foreground">Historial de evaluaciones y retroalimentación.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-white">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-medium">Aún no tienes evaluaciones</h3>
                        <p className="text-muted-foreground">Cuando tu supervisor inicie un ciclo, aparecerá aquí.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map((review) => {
                            const config = getStatusConfig(review.status, review.status_display);
                            const StatusIcon = config.icon;

                            return (
                                <Card key={review.id} className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500 overflow-hidden">
                                    <CardHeader className="pb-2 bg-slate-50/50 border-b">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="mb-2">{review.period_name}</Badge>
                                                <CardTitle className="text-lg">Evaluación de Periodo</CardTitle>
                                            </div>
                                            {review.final_score && (
                                                <div className="text-right">
                                                    <span className="block text-2xl font-bold text-indigo-600">{Number(review.final_score).toFixed(2)}</span>
                                                    <span className="text-xs text-muted-foreground">Nota Final</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <StatusIcon className="h-4 w-4" />
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                                                {config.text}
                                            </span>
                                        </div>

                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Evaluador:</span> <span className="font-medium">{review.evaluator_name}</span>
                                        </div>

                                        <Button
                                            className="w-full mt-2"
                                            variant={review.status === 'ENV' ? 'default' : 'outline'}
                                            onClick={() => router.push(`/performance/evaluate/${review.id}`)}
                                            disabled={review.status === 'BOR'} // No puede entrar si el jefe aún escribe
                                        >
                                            {review.status === 'ENV' ? "Revisar y Firmar" : "Ver Detalles"}
                                        </Button>

                                        {review.status === 'BOR' && (
                                            <p className="text-[10px] text-center text-muted-foreground">
                                                Disponible cuando su supervisor finalice.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}