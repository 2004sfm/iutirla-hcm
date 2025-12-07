"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    ArrowLeft,
    Save,
    Send,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { PerformanceReview, ReviewDetail, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/performance";
import { CompetencyRating } from "@/components/performance/competency-rating";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function EvaluationEditPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: review, error, isLoading, mutate } = useSWR<PerformanceReview>(
        id ? `/api/performance/reviews/${id}/` : null,
        fetcher
    );

    const [details, setDetails] = useState<ReviewDetail[]>([]);
    const [feedbackManager, setFeedbackManager] = useState("");
    const [saving, setSaving] = useState(false);

    // Initialize form data when review loads
    useEffect(() => {
        if (review?.details) {
            setDetails(review.details);
            setFeedbackManager(review.feedback_manager || "");
        }
    }, [review]);

    // Group details by category
    const detailsByCategory = details.reduce((acc, detail) => {
        const category = detail.competency_category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(detail);
        return acc;
    }, {} as Record<string, ReviewDetail[]>);

    const categories = Object.keys(CATEGORY_LABELS);

    // Calculate progress
    const totalCompetencies = details.length;
    const ratedCompetencies = details.filter(d => d.score > 0).length;
    const progressPercentage = totalCompetencies > 0
        ? Math.round((ratedCompetencies / totalCompetencies) * 100)
        : 0;

    // Calculate average
    const calculateAverage = () => {
        if (ratedCompetencies === 0) return 0;
        const sum = details.reduce((acc, d) => acc + d.score, 0);
        return (sum / totalCompetencies).toFixed(2);
    };

    const handleDetailChange = (updatedDetail: ReviewDetail) => {
        setDetails(prev => prev.map(d =>
            d.competency === updatedDetail.competency ? updatedDetail : d
        ));
    };

    const handleSave = async (submit: boolean = false) => {
        // Validate if submitting
        if (submit && ratedCompetencies < totalCompetencies) {
            toast.error("Debes calificar todas las competencias antes de enviar");
            return;
        }

        setSaving(true);
        const toastId = toast.loading(submit ? "Enviando evaluación..." : "Guardando borrador...");

        try {
            // Update review details
            await Promise.all(
                details.map(detail =>
                    apiClient.patch(`/api/performance/review-details/${detail.id}/`, {
                        score: detail.score,
                        comment: detail.comment || ""
                    })
                )
            );

            // Update review feedback and status
            await apiClient.patch(`/api/performance/reviews/${id}/`, {
                feedback_manager: feedbackManager,
                status: submit ? "ENV" : "BOR"
            });

            toast.success(
                submit ? "¡Evaluación enviada exitosamente!" : "Borrador guardado",
                { id: toastId }
            );

            mutate(); // Refresh data

            if (submit) {
                setTimeout(() => {
                    router.push("/admin/performance/teams");
                }, 1500);
            }
        } catch (error: any) {
            console.error("Error saving review:", error);
            toast.error("Error al guardar la evaluación", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                </div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No se pudo cargar la evaluación
                    </AlertDescription>
                </Alert>
                <Link href="/admin/performance/teams" className="mt-4 inline-block">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Equipos
                    </Button>
                </Link>
            </div>
        );
    }

    const isReadOnly = review.status !== "BOR";

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/performance/teams">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Equipos
                    </Button>
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Evaluación de Desempeño
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {review.employee_name} - {review.position_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Período: {review.period_name}
                        </p>
                    </div>
                    <Badge className={review.status === "BOR" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                        {review.status_display}
                    </Badge>
                </div>
            </div>

            {/* Progress and Average */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Progreso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{ratedCompetencies} de {totalCompetencies} competencias</span>
                                <span className="font-semibold">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-brand-primary h-2 rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-brand-primary">
                            {calculateAverage()}
                            <span className="text-sm text-muted-foreground ml-2">/ 5.00</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isReadOnly && (
                <Alert className="mb-6">
                    <AlertCircle className="h-4 h-4" />
                    <AlertDescription>
                        Esta evaluación ya ha sido enviada y no puede ser modificada.
                    </AlertDescription>
                </Alert>
            )}

            {/* Evaluation Form with Tabs */}
            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="CAL" className="w-full">
                        <TabsList className="grid w-full grid-cols-6 mb-6">
                            {categories.map((category) => {
                                const categoryDetails = detailsByCategory[category] || [];
                                const ratedInCategory = categoryDetails.filter(d => d.score > 0).length;
                                const totalInCategory = categoryDetails.length;

                                return (
                                    <TabsTrigger
                                        key={category}
                                        value={category}
                                        className="relative"
                                    >
                                        <div className="flex flex-col items-center">
                                            <span>{CATEGORY_LABELS[category]}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {ratedInCategory}/{totalInCategory}
                                            </span>
                                        </div>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {categories.map((category) => {
                            const categoryDetails = detailsByCategory[category] || [];

                            return (
                                <TabsContent key={category} value={category} className="space-y-4">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category]}`} />
                                            {CATEGORY_LABELS[category]}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Evalúa las siguientes {categoryDetails.length} competencias
                                        </p>
                                    </div>

                                    {categoryDetails.map((detail) => (
                                        <CompetencyRating
                                            key={detail.competency}
                                            detail={detail}
                                            onChange={handleDetailChange}
                                            disabled={isReadOnly}
                                        />
                                    ))}
                                </TabsContent>
                            );
                        })}
                    </Tabs>

                    {/* Manager Feedback */}
                    <div className="mt-8 space-y-2">
                        <Label htmlFor="feedback">Comentarios Generales del Evaluador</Label>
                        <Textarea
                            id="feedback"
                            value={feedbackManager}
                            onChange={(e) => setFeedbackManager(e.target.value)}
                            placeholder="Agrega comentarios generales sobre el desempeño del empleado..."
                            rows={4}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Action Buttons */}
                    {!isReadOnly && (
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Guardar Borrador
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleSave(true)}
                                disabled={saving || ratedCompetencies < totalCompetencies}
                                className="bg-brand-primary hover:bg-brand-primary/90"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Enviar Evaluación
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
