'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { CatalogHeader } from "@/components/CatalogHeader";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ClipboardList, User, PlayCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Review {
    id: number;
    employee_name: string;
    position_name: string;
    department_name: string;
    period_name: string;
    status: string;        // 'BOR', 'ENV', 'ACE'
    status_display: string;
    final_score: number | null;
}

export default function TeamReviewsPage() {
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar Evaluaciones
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // Este endpoint ya filtra automáticamente:
                // - Si eres Jefe: Ves a tus subordinados.
                // - Si eres Admin: Ves todo.
                const { data } = await apiClient.get('/api/performance/reviews/');
                const results = Array.isArray(data) ? data : (data.results || []);
                setReviews(results);
            } catch (error) {
                console.error(error);
                toast.error("Error cargando las evaluaciones.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    // Helper para colores de estado
    const getStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'BOR': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">{label}</Badge>; // Borrador
            case 'ENV': return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{label}</Badge>; // Enviada
            case 'ACE': return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">{label}</Badge>; // Aceptada
            default: return <Badge variant="outline">{label}</Badge>;
        }
    };

    return (
        <>
            <CatalogHeader items={[
                { name: "Evaluación", href: "#" },
                { name: "Mi Equipo / Pendientes", href: "/admin/performance/team" }
            ]} />

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Evaluaciones Pendientes</h2>
                        <p className="text-muted-foreground">
                            Gestione el desempeño de su equipo a cargo.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                            Listado de Personal a Evaluar
                        </CardTitle>
                        <CardDescription>
                            Seleccione un empleado para iniciar o continuar su evaluación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead>Periodo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Nota Final</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : reviews.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No tiene evaluaciones asignadas en este momento.</TableCell></TableRow>
                                    ) : (
                                        reviews.map((review) => (
                                            <TableRow key={review.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                            {review.employee_name.charAt(0)}
                                                        </div>
                                                        {review.employee_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{review.position_name}</span>
                                                        <span className="text-xs text-muted-foreground">{review.department_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{review.period_name}</TableCell>
                                                <TableCell>{getStatusBadge(review.status, review.status_display)}</TableCell>
                                                <TableCell className="font-mono font-bold">
                                                    {review.final_score ? review.final_score : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {/* Botón de Acción según estado */}
                                                    {review.status === 'BOR' ? (
                                                        <Button size="sm" onClick={() => router.push(`/admin/performance/evaluate/${review.id}`)}>
                                                            <PlayCircle className="mr-2 h-4 w-4" /> Evaluar
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/performance/evaluate/${review.id}`)}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Ver Detalles
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}