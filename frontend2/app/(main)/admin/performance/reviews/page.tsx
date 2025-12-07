"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, FileText, Eye } from "lucide-react";
import apiClient from "@/lib/api-client";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

interface PerformanceReview {
    id: number;
    employee_name: string;
    position_name: string;
    department_name: string;
    period_name: string;
    status: string;
    status_display: string;
    final_score: number | null;
    evaluator_name: string;
}

const statusColor = (status: string) => {
    switch (status) {
        case "BOR": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "ENV": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "ACE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        default: return "bg-gray-100 text-gray-800";
    }
};

export default function PerformanceReviewsPage() {
    const { data: reviews, error, isLoading } = useSWR<PerformanceReview[]>(
        "/api/performance/reviews/",
        fetcher
    );

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Cargando evaluaciones...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>No se pudieron cargar las evaluaciones</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Evaluaciones de Desempeño</h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona las evaluaciones de desempeño de los empleados
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Listado de Evaluaciones
                    </CardTitle>
                    <CardDescription>
                        {reviews?.length || 0} evaluación(es) registrada(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!reviews || reviews.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No hay evaluaciones registradas</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Puesto</TableHead>
                                    <TableHead>Departamento</TableHead>
                                    <TableHead>Periodo</TableHead>
                                    <TableHead>Evaluador</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Puntaje</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell className="font-medium">{review.employee_name}</TableCell>
                                        <TableCell>{review.position_name}</TableCell>
                                        <TableCell>{review.department_name}</TableCell>
                                        <TableCell>{review.period_name}</TableCell>
                                        <TableCell>{review.evaluator_name}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColor(review.status)}>
                                                {review.status_display}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {review.final_score ? (
                                                <span className="font-semibold">{review.final_score.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/performance/reviews/${review.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver Detalles
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
