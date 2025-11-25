'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import {
    Loader2, Save, Send, CheckCircle2,
    Star, MessageSquare, AlertCircle, Edit, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from '@radix-ui/react-label';


// --- TIPOS ---
interface ReviewDetail {
    id: number;
    competency: number;
    competency_name: string;
    competency_description: string;
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
    // IDs de la relación (vienen del serializer)
    employee_person_id: number;
    evaluator_id: number;
}

// --- COMPONENTE PRINCIPAL ---

export function PerformanceEvaluationForm({ reviewId }: { reviewId: number }) {
    const { user } = useAuth();
    const router = useRouter();

    const [review, setReview] = useState<PerformanceReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados de Edición Local
    const [localDetails, setLocalDetails] = useState<ReviewDetail[]>([]);
    const [managerFeedback, setManagerFeedback] = useState("");
    const [employeeFeedback, setEmployeeFeedback] = useState("");

    // Roles Derivados
    const currentPersonId = user?.person?.id;
    const isEvaluator = currentPersonId === review?.evaluator_id;
    const isEmployee = currentPersonId === review?.employee_person_id;

    // Estados de Proceso
    const isEditingAllowed = isEvaluator && (review?.status === 'BOR'); // Jefe solo edita en Borrador
    const isSigningAllowed = isEmployee && (review?.status === 'ENV'); // Empleado solo firma en Enviada
    const isFinalized = review?.status === 'ACE';

    // --- CARGAR DATOS ---
    const fetchData = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/performance/reviews/${reviewId}/`);

            // Si el objeto está vacío o no es accesible (backend 404), esto fallaría antes.
            setReview(data);

            // Inicializar estados editables locales
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


    // --- MANEJADORES DE ESTADO LOCAL ---

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


    // --- SUBMIT: GUARDAR BORRADOR, ENVIAR O ACEPTAR ---

    const saveProgress = async (action: 'draft' | 'submit' | 'accept') => {
        if (!review || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. Guardar o Actualizar Detalles (Solo si soy Jefe)
            if (isEvaluator) {
                const updatePromises = localDetails.map(detail =>
                    apiClient.patch(`/api/performance/details/${detail.id}/`, {
                        score: detail.score,
                        comment: detail.comment
                    })
                );
                await Promise.all(updatePromises);
            }

            // 2. Guardar Cabecera (Feedback y Estatus)
            const payload: any = {};

            if (action === 'draft') {
                payload.feedback_manager = managerFeedback;
            } else if (action === 'submit') {
                payload.feedback_manager = managerFeedback;
                payload.status = 'ENV'; // Jefe envía
            } else if (action === 'accept') {
                payload.feedback_employee = employeeFeedback;
                payload.status = 'ACE'; // Empleado acepta
            }

            await apiClient.patch(`/api/performance/reviews/${reviewId}/`, payload);

            toast.success(
                action === 'accept' ? "Resultados firmados." :
                    action === 'submit' ? "Evaluación enviada al empleado." : "Borrador guardado."
            );

            // 🚨 CORRECCIÓN DE RUTAS 🚨
            if (action === 'submit') {
                // JEFE: Redirige a la lista de equipos (PLURAL)
                router.push('/performance/teams');
            }
            else if (action === 'accept') {
                // EMPLEADO: Redirige a su historial personal
                router.push('/performance/my-reviews');
            }
            else {
                // BORRADOR: Recarga para ver cambios (promedio, etc.)
                window.location.reload();
            }

        } catch (error) {
            toast.error("Error al guardar la evaluación.");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) return <div className="max-w-4xl mx-auto flex h-screen justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!review) return <div>No se pudo encontrar la evaluación.</div>;


    // --- RENDERIZADO ---

    const roleLabel = isEvaluator ? "Supervisor" : (isEmployee ? "Colaborador" : "Observador");
    const roleIconColor = isEvaluator ? "border-indigo-600" : "border-slate-400";
    const statusColor = review.status === 'BOR' ? "bg-yellow-500" : review.status === 'ENV' ? "bg-blue-500" : "bg-green-600";

    // Obtenemos el puntaje actual para el jefe/empleado
    const currentScore = localDetails.filter(d => d.score > 0).length;


    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">

            <Button variant="outline" size="sm" onClick={() => router.push('/performance')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Evaluaciones
            </Button>

            {/* 1. ENCABEZADO Y RESUMEN */}
            <Card className={cn("border-l-4", roleIconColor)}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{review.period_name}</CardTitle>
                            <CardDescription>Evaluación de Desempeño: {review.position_name} en {review.department_name}</CardDescription>

                            <Badge className={statusColor}>{review.status_display}</Badge>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Nota Final</p>
                            {review.final_score ? Number(review.final_score).toFixed(2) : '--'} / 5                        </div>
                    </div>

                    <Separator className="mt-4" />

                    <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t">

                        {/* EMPLEADO (El evaluado) - ARREGLADO */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12"> {/* <-- Se añadió el contenedor Avatar */}
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                    {review.employee_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Colaborador Evaluado</p>
                                <p className="font-bold text-lg">{review.employee_name}</p>
                                <p className="text-xs text-muted-foreground">{review.position_name} en {review.department_name}</p>
                            </div>
                        </div>

                        {/* EVALUADOR (El jefe) - ARREGLADO */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12"> {/* <-- Se añadió el contenedor Avatar */}
                                <AvatarFallback className="bg-slate-100 text-slate-700">
                                    {review.evaluator_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Evaluador</p>
                                <p className="font-bold text-lg">{review.evaluator_name}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* 2. LISTA DE COMPETENCIAS (EL EXAMEN) */}
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" /> Competencias a Evaluar
            </h3>

            <div className="space-y-4">
                {localDetails.map((detail) => (
                    <Card key={detail.id} className="overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-b">
                            <h4 className="font-bold text-base">{detail.competency_name}</h4>
                            <p className="text-sm text-muted-foreground">{detail.competency_description}</p>
                        </div>
                        <CardContent className="p-4 grid md:grid-cols-12 gap-6">

                            {/* SELECCIÓN DE NOTA (1-5) */}
                            <div className="md:col-span-4 flex flex-col justify-start gap-2">
                                <span className="text-xs font-semibold uppercase text-muted-foreground">Calificación (1-5)</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            disabled={!isEditingAllowed} // Solo Jefe en Borrador
                                            onClick={() => handleScoreChange(detail.id, star)}
                                            className={cn(
                                                "w-9 h-9 text-sm font-bold transition-all rounded-full border",
                                                detail.score >= star
                                                    ? "bg-yellow-400 border-yellow-500 text-white shadow-md hover:bg-yellow-500"
                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            )}
                                        >
                                            {star}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* COMENTARIO */}
                            <div className="md:col-span-8">
                                <span className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Observación</span>
                                <Textarea
                                    disabled={!isEditingAllowed}
                                    value={detail.comment || ""}
                                    onChange={(e) => handleCommentChange(detail.id, e.target.value)}
                                    placeholder={isEditingAllowed ? "Justifique la calificación..." : "Sin observaciones."}
                                    className="resize-none h-20 text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 3. FEEDBACK Y CIERRE */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" /> Feedback General
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Comentario del Jefe */}
                    <div className="space-y-1">
                        <Label>Comentarios del Supervisor</Label>
                        <Textarea
                            disabled={!isEditingAllowed}
                            value={managerFeedback}
                            onChange={(e) => setManagerFeedback(e.target.value)}
                            placeholder="Conclusiones finales y recomendaciones..."
                            className="min-h-[100px]"
                        />
                    </div>

                    {/* Comentario del Empleado (Solo editable si es ENV y soy yo) */}
                    {(isEmployee || isFinalized || review.status === 'ENV') && (
                        <div className="space-y-1 pt-4 border-t">
                            <Label>Comentarios del Colaborador (Descargo)</Label>
                            <Textarea
                                disabled={!isSigningAllowed} // Solo editable si está ENV y soy el empleado
                                value={employeeFeedback}
                                onChange={(e) => setEmployeeFeedback(e.target.value)}
                                placeholder="Comentarios sobre su evaluación..."
                                className="min-h-[100px] border-indigo-200 bg-indigo-50/30"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4. BOTONES DE ACCIÓN (Fixed Bar - Sticky Bottom) */}
            <div className="flex justify-end gap-3 sticky bottom-0 z-10 bg-background/90 p-4 backdrop-blur-sm border-t shadow-lg">

                {/* ACCIONES DEL JEFE */}
                {isEvaluator && review.status === 'BOR' && (
                    <>
                        <Button variant="outline" onClick={() => saveProgress('draft')} disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> Guardar Borrador
                        </Button>
                        <Button onClick={() => saveProgress('submit')} disabled={isSubmitting || currentScore === 0}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Finalizar y Enviar
                        </Button>
                    </>
                )}

                {/* ACCIONES DEL EMPLEADO */}
                {isSigningAllowed && (
                    <Button onClick={() => saveProgress('accept')} className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                        {isSubmitting ? "Procesando..." : "Firmar y Aceptar"}
                    </Button>
                )}

                {/* MENSAJE FINAL */}
                {isFinalized && (
                    <div className="flex w-full items-center justify-between text-sm">
                        <Alert className="bg-green-50 border-green-200 w-full">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle>Evaluación Cerrada</AlertTitle>
                            <strong>{Number(review.final_score).toFixed(2)}/5</strong>
                        </Alert>
                    </div>
                )}
            </div>
        </div>
    );
}