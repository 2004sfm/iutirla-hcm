'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
// CAMBIO: Usamos CatalogHeader
import { CatalogHeader } from "@/components/CatalogHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, CheckCircle2, Loader2 } from "lucide-react";

// Reutilizamos la interfaz localmente
interface Review {
    id: number;
    employee_name: string;
    position_name: string;
    period_name: string;
    status: string;
    status_display: string;
    final_score: number | null;
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const deptId = resolvedParams.id;

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // El filtro ?department=ID ahora es procesado por el backend
                const { data } = await apiClient.get(`/api/performance/reviews/?department=${deptId}`);
                setReviews(Array.isArray(data) ? data : (data.results || []));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [deptId]);

    const getStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'BOR': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{label}</Badge>;
            case 'ENV': return <Badge variant="default" className="bg-blue-600">{label}</Badge>;
            case 'ACE': return <Badge variant="outline" className="text-green-600 border-green-600">{label}</Badge>;
            default: return <Badge variant="outline">{label}</Badge>;
        }
    };

    return (
        <>
            <CatalogHeader
                items={[
                    { name: "Mis Equipos", href: "/performance/teams" },
                    { name: "Detalle de Equipo", href: "#" }
                ]}
                hideSidebarTrigger
            />

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Evaluación de Personal</h1>
                </div>

                <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-950">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Cargo</TableHead>
                                <TableHead>Periodo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Nota</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                            ) : reviews.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay evaluaciones en este departamento.</TableCell></TableRow>
                            ) : (
                                reviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell className="font-medium">{review.employee_name}</TableCell>
                                        <TableCell>{review.position_name}</TableCell>
                                        <TableCell>{review.period_name}</TableCell>
                                        <TableCell>{getStatusBadge(review.status, review.status_display)}</TableCell>
                                        <TableCell className="font-mono font-bold">{review.final_score ?? "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => router.push(`/performance/evaluate/${review.id}`)}>
                                                {review.status === 'BOR' ? <><PlayCircle className="mr-2 h-4 w-4" /> Evaluar</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Ver</>}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}