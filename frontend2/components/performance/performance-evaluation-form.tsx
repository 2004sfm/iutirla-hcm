"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import {
    Loader2, Save, Send, CheckCircle2,
    Star, MessageSquare, ArrowLeft, Briefcase, User
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from '@/components/ui/label';
import { PerformanceRadarChart } from "@/components/performance/performance-radar-chart";

// Types
interface ReviewDetail {
    id: number;
    competency: number;
    competency_name: string;
    competency_description: string;
    competency_category: string;
    competency_category_display: string;
    score: number;
    comment: string;
}

interface PerformanceReview {
    id: number;
    employee_name: string;
    position_name: string;
    department_name: string;
    evaluator_name: string;
    period_name: string;
    status: 'BOR' | 'ENV' | 'ACE';
    status_display: string;
    final_score: number | null;
    feedback_manager: string;
    feedback_employee: string;
    details: ReviewDetail[];
    employee_person_id: number;
    evaluator_id: number;
}

interface RadarDataPoint {
    category: string;
    score: number;
    fullMark: number;
}

export function PerformanceEvaluationForm({ reviewId }: { reviewId: number }) {
    const { user } = useAuth();
    const router = useRouter();

    const [review, setReview] = useState<PerformanceReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local Editing State
    const [localDetails, setLocalDetails] = useState<ReviewDetail[]>([]);
    const [managerFeedback, setManagerFeedback] = useState("");
    const [employeeFeedback, setEmployeeFeedback] = useState("");

    // UI Logic for Action Bar Alignment
    const containerRef = useRef<HTMLDivElement>(null);
    const [barStyle, setBarStyle] = useState<{ left: number, width: number } | null>(null);

    useEffect(() => {
        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setBarStyle({
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        // Initial update
        updatePosition();

        // Update on resize/scroll
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        // Also use ResizeObserver for container changes
        const observer = new ResizeObserver(updatePosition);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            observer.disconnect();
        };
    }, []);

    // Use currentPersonId from auth context
    // Assuming user object has a person property with id
    const currentPersonId = user?.person?.id;

    // Derived Roles
    const isEvaluator = currentPersonId === review?.evaluator_id;
    const isEmployee = currentPersonId === review?.employee_person_id;

    // Process States
    const isEditingAllowed = isEvaluator && (review?.status === 'BOR');
    const isSigningAllowed = isEmployee && (review?.status === 'ENV');
    const isFinalized = review?.status === 'ACE';
    const showRadarChart = review?.status !== 'BOR';

    const fetchData = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/performance/reviews/${reviewId}/`);
            setReview(data);
            setLocalDetails(data.details);
            setManagerFeedback(data.feedback_manager || "");
            setEmployeeFeedback(data.feedback_employee || "");
        } catch (error) {
            console.error(error);
            toast.error("No se pudo cargar la evaluación.");
            setReview(null);
        } finally {
            setLoading(false);
        }
    }, [reviewId]);

    useEffect(() => {
        if (currentPersonId) fetchData();
    }, [currentPersonId, fetchData]);

    // Calculate Radar Data
    const getRadarData = (): RadarDataPoint[] => {
        if (!localDetails.length) return [];

        const categoryMap = new Map<string, { total: number; count: number; name: string }>();

        localDetails.forEach(d => {
            const cat = d.competency_category || "SIN";
            const name = d.competency_category_display || "General";
            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, { total: 0, count: 0, name });
            }
            const current = categoryMap.get(cat)!;
            current.total += d.score;
            current.count += 1;
        });

        return Array.from(categoryMap.values()).map(c => ({
            category: c.name,
            score: c.count ? c.total / c.count : 0,
            fullMark: 5
        }));
    };

    const handleScoreChange = (detailId: number, newScore: number) => {
        if (!isEditingAllowed) return;
        setLocalDetails(prev => prev.map(d =>
            d.id === detailId ? { ...d, score: newScore } : d
        ));
    };

    const handleCommentChange = (detailId: number, comment: string) => {
        if (!isEditingAllowed) return;
        setLocalDetails(prev => prev.map(d =>
            d.id === detailId ? { ...d, comment } : d
        ));
    };

    const saveProgress = async (action: 'draft' | 'submit' | 'accept') => {
        if (!review || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. Save Details (Only Evaluator)
            if (isEvaluator) {
                const updatePromises = localDetails.map(detail =>
                    apiClient.patch(`/api/performance/details/${detail.id}/`, {
                        score: detail.score,
                        comment: detail.comment
                    })
                );
                await Promise.all(updatePromises);
            }

            // 2. Save Header
            const payload: any = {};
            if (action === 'draft') {
                payload.feedback_manager = managerFeedback;
            } else if (action === 'submit') {
                payload.feedback_manager = managerFeedback;
                payload.status = 'ENV';
            } else if (action === 'accept') {
                payload.feedback_employee = employeeFeedback;
                payload.status = 'ACE';
            }

            await apiClient.patch(`/api/performance/reviews/${reviewId}/`, payload);

            toast.success(
                action === 'accept' ? "Resultados firmados." :
                    action === 'submit' ? "Evaluación enviada." : "Borrador guardado."
            );

            if (action === 'submit' || action === 'accept') {
                router.push('/performance'); // Redirect to main list
            } else {
                window.location.reload();
            }

        } catch (error) {
            toast.error("Error al guardar la evaluación.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (!review) return <div className="p-8 text-center text-muted-foreground">No se pudo encontrar la evaluación.</div>;

    const roleLabel = isEvaluator ? "Supervisor" : (isEmployee ? "Evaluado" : "Observador");
    const statusColor = review.status === 'BOR' ? "bg-yellow-500" : review.status === 'ENV' ? "bg-blue-500" : "bg-green-600";
    const currentScore = localDetails.filter(d => d.score > 0).length;

    // Validation: All competencies must have score AND comment
    const allCompetenciesComplete = localDetails.every(d => d.score > 0 && d.comment?.trim().length > 0);
    const canSubmit = allCompetenciesComplete;

    return (
        <div ref={containerRef} className=" mx-auto space-y-8 pb-20">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>

            {/* HEADER */}
            <Card className="overflow-hidden border-none shadow-md bg-white pt-0">
                <div className={cn("h-2 w-full bg-brand-primary")} />
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">{review.period_name}</CardTitle>
                            <CardDescription className="text-base">
                                {review.position_name.split(' - ')[0]} • {review.department_name}
                            </CardDescription>
                            <Badge className={cn("mt-2", statusColor)}>{review.status_display}</Badge>
                        </div>
                        <div className="text-right bg-slate-50 p-3 rounded-lg border">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Nota Final</p>
                            <p className="text-3xl font-bold text-slate-800">
                                {review.final_score ? Number(review.final_score).toFixed(2) : '--'}
                                <span className="text-base font-normal text-muted-foreground ml-1">/ 5</span>
                            </p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Employee */}
                        <div className="flex items-center gap-4 p-3 rounded-lg border bg-slate-50/50">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                    {review.employee_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evaluado</p>
                                <p className="font-semibold text-lg leading-tight">{review.employee_name}</p>
                            </div>
                        </div>

                        {/* Evaluator */}
                        <div className="flex items-center gap-4 p-3 rounded-lg border bg-slate-50/50">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                    {review.evaluator_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evaluador</p>
                                <p className="font-semibold text-lg leading-tight">{review.evaluator_name}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* RADAR CHART (Only if completed/submitted) */}
            {showRadarChart && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PerformanceRadarChart
                        data={getRadarData()}
                        title="Resultados por Categoría"
                        description="Visualización del desempeño en las dimensiones evaluadas."
                    />
                </div>
            )}

            {/* COMPETENCIES LIST */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <h3 className="text-xl font-semibold text-slate-800">Competencias</h3>
                </div>

                {localDetails.map((detail) => (
                    <Card key={detail.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow p-0">
                        <div className="bg-brand-primary p-4 border-b border-white/10">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-base text-white">{detail.competency_name}</h4>
                                        <Badge variant="secondary" className="text-xs font-normal bg-white text-brand-primary hover:bg-white/90">
                                            {detail.competency_category_display || "General"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-white/90 leading-relaxed">{detail.competency_description}</p>
                                </div>
                                {isFinalized && detail.score > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "text-sm px-3 py-1 bg-white hover:bg-white/90 shadow-sm font-bold border-0",
                                            detail.score >= 4 ? "text-green-600" :
                                                detail.score >= 3 ? "text-amber-600" :
                                                    "text-red-600"
                                        )}
                                    >
                                        {detail.score} / 5
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <CardContent className="p-5 flex flex-col md:flex-row gap-6">
                            {/* SCORE SELECTION (Interactive) */}
                            <div className="flex-none min-w-fit flex flex-col justify-start gap-3">
                                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Calificación</span>
                                <div className="w-fit">
                                    <div className="flex gap-1.5 mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                disabled={!isEditingAllowed}
                                                onClick={() => handleScoreChange(detail.id, star)}
                                                className={cn(
                                                    "w-10 h-10 text-sm font-bold transition-all rounded-lg border-2 flex items-center justify-center",
                                                    detail.score >= star
                                                        ? "bg-amber-400 border-amber-500 text-white shadow-sm scale-100"
                                                        : "bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300",
                                                    !isEditingAllowed && detail.score < star && "opacity-30",
                                                    !isEditingAllowed && detail.score >= star && "opacity-100"
                                                )}
                                            >
                                                {star}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between px-1 text-xs text-muted-foreground w-full">
                                        <span>Bajo</span>
                                        <span>Alto</span>
                                    </div>
                                </div>
                            </div>

                            {/* COMMENT */}
                            <div className="flex-1 w-full">
                                <span className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-wider">Observación</span>
                                <Textarea
                                    disabled={!isEditingAllowed}
                                    value={detail.comment || ""}
                                    onChange={(e) => handleCommentChange(detail.id, e.target.value)}
                                    placeholder={isEditingAllowed ? "Justifique la calificación con ejemplos..." : "Sin observaciones registradas."}
                                    className={cn(
                                        "resize-none h-24 text-sm transition-colors",
                                        isEditingAllowed ? "bg-white" : "bg-slate-50 text-slate-600 border-transparent resize-none"
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* FEEDBACK SECTION */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <MessageSquare className="h-5 w-5 text-brand-primary" /> Feedback y Conclusiones
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-base font-semibold text-slate-800">Comentarios del Supervisor</Label>
                        <Textarea
                            disabled={!isEditingAllowed}
                            value={managerFeedback}
                            onChange={(e) => setManagerFeedback(e.target.value)}
                            placeholder="Fortalezas, áreas de mejora y plan de acción..."
                            className="min-h-[120px]"
                        />
                    </div>

                    {(isEmployee || isFinalized || review.status === 'ENV') && (
                        <div className="space-y-2 pt-6 border-t border-dashed">
                            <Label className="text-base font-semibold text-slate-800">Comentarios del Evaluado</Label>
                            <p className="text-xs text-muted-foreground mb-2">Este espacio es para que el evaluado exprese su acuerdo, desacuerdo o comentarios finales.</p>
                            <Textarea
                                disabled={!isSigningAllowed}
                                value={employeeFeedback}
                                onChange={(e) => setEmployeeFeedback(e.target.value)}
                                placeholder="Comentarios sobre su evaluación..."
                                className={cn(
                                    "min-h-[120px]",
                                    isSigningAllowed && "border-indigo-300 bg-indigo-50/20 focus:border-indigo-500"
                                )}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ACTION BAR */}
            {barStyle && (
                <div
                    className="fixed bottom-4 z-50 transition-all duration-75 ease-out"
                    style={{
                        left: `${barStyle.left}px`,
                        width: `${barStyle.width}px`
                    }}
                >
                    <div className="bg-white/95 backdrop-blur-md border rounded-xl p-2 sm:p-3 shadow-lg w-full">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                            <div className="text-sm text-muted-foreground hidden sm:block">
                                {isEditingAllowed && "Modo Edición: Supervisor"}
                                {isSigningAllowed && "Modo Revisión: Evaluado"}
                                {isFinalized && "Evaluación Finalizada"}
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto ml-auto">
                                {isEvaluator && review.status === 'BOR' && (
                                    <>
                                        <Button variant="outline" onClick={() => saveProgress('draft')} disabled={isSubmitting} className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10">
                                            <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Borrador
                                        </Button>
                                        <Button
                                            onClick={() => saveProgress('submit')}
                                            disabled={isSubmitting || !canSubmit}
                                            className="bg-brand-primary hover:bg-brand-primary/90 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                                        >
                                            {isSubmitting ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Send className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                                            Finalizar
                                        </Button>
                                    </>
                                )}

                                {isSigningAllowed && (
                                    <Button onClick={() => saveProgress('accept')} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                        Firmar y Aceptar
                                    </Button>
                                )}

                                {isFinalized && (
                                    <Alert className="bg-green-50 border-green-200 py-2 px-4 h-10 flex items-center w-full sm:w-auto justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-800">Firmado y Cerrado</span>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
