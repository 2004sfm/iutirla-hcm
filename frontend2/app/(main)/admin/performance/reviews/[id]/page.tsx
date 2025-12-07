"use client";

import { use } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PerformanceRadarChart } from "@/components/performance/performance-radar-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Briefcase, Calendar, BarChart3 } from "lucide-react";
import apiClient from "@/lib/api-client";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface ReviewDetail {
    id: number;
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
    period_name: string;
    evaluator_name: string;
    status: string;
    status_display: string;
    final_score: number | null;
    feedback_manager: string;
    feedback_employee: string;
    details: ReviewDetail[];
}

export default function PerformanceReviewDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const { data: review, error, isLoading } = useSWR<PerformanceReview>(
        id ? `/api/performance/reviews/${id}/` : null,
        fetcher
    );

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Cargando evaluación...</p>
            </div>
        );
    }

    if (error || !review) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>No se pudo cargar la evaluación</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Group details by category and calculate averages
    const categoryMap = new Map<string, { name: string; scores: number[]; details: ReviewDetail[] }>();

    review.details.forEach((detail) => {
        const cat = detail.competency_category || "SIN";
        const catName = detail.competency_category_display || "Sin Categoría";

        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { name: catName, scores: [], details: [] });
        }

        const catData = categoryMap.get(cat)!;
        catData.scores.push(detail.score);
        catData.details.push(detail);
    });

    // Prepare radar chart data
    const radarData = Array.from(categoryMap.entries()).map(([key, value]) => ({
        category: value.name,
        score: value.scores.reduce((a, b) => a + b, 0) / value.scores.length,
        fullMark: 5,
    }));

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-3xl mb-2">Evaluación de Desempeño</CardTitle>
                            <CardDescription className="text-base">{review.period_name}</CardDescription>
                        </div>
                        <Badge className={
                            review.status === "BOR" ? "bg-yellow-500" :
                                review.status === "ENV" ? "bg-blue-500" :
                                    review.status === "ACE" ? "bg-green-500" : "bg-gray-500"
                        }>
                            {review.status_display}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Empleado</p>
                                <p className="text-lg font-semibold">{review.employee_name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Puesto</p>
                                <p className="text-lg font-semibold">{review.position_name}</p>
                                <p className="text-sm text-muted-foreground">{review.department_name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <BarChart3 className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Evaluador</p>
                                <p className="text-lg font-semibold">{review.evaluator_name}</p>
                            </div>
                        </div>
                    </div>

                    {review.final_score !== null && (
                        <>
                            <Separator className="my-6" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Puntaje Final</p>
                                <p className="text-5xl font-bold text-brand-primary">{review.final_score.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground mt-1">sobre 5.0</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Radar Chart */}
            {radarData.length > 0 && (
                <div className="mb-6">
                    <PerformanceRadarChart
                        data={radarData}
                        title="Desempeño por Categoría"
                        description="Promedio de puntajes en cada dimensión de evaluación"
                    />
                </div>
            )}

            {/* Details by Category */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Detalles de la Evaluación</CardTitle>
                    <CardDescription>Competencias evaluadas agrupadas por categoría</CardDescription>
                </CardHeader>
                <CardContent>
                    {Array.from(categoryMap.entries()).map(([key, value]) => (
                        <div key={key} className="mb-8 last:mb-0">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-xl font-bold">{value.name}</h3>
                                <Badge variant="secondary">
                                    Promedio: {(value.scores.reduce((a, b) => a + b, 0) / value.scores.length).toFixed(2)}
                                </Badge>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Competencia</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-center">Puntaje</TableHead>
                                        <TableHead>Comentarios</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {value.details.map((detail) => (
                                        <TableRow key={detail.id}>
                                            <TableCell className="font-medium">{detail.competency_name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-md">
                                                {detail.competency_description}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={detail.score >= 4 ? "default" : detail.score >= 3 ? "secondary" : "destructive"}>
                                                    {detail.score}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{detail.comment || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Separator className="mt-6" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Feedback Section */}
            {(review.feedback_manager || review.feedback_employee) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {review.feedback_manager && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Comentarios del Evaluador</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{review.feedback_manager}</p>
                            </CardContent>
                        </Card>
                    )}

                    {review.feedback_employee && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Comentarios del Empleado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{review.feedback_employee}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
