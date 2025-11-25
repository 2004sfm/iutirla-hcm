'use client';

import { useState, useEffect, Suspense } from 'react'; // Importar Suspense es buena práctica con useSearchParams
import { useRouter, useSearchParams } from 'next/navigation'; // <--- IMPORTANTE
import apiClient from '@/lib/apiClient';
import { useAuth } from "@/context/AuthContext";
import { CatalogHeader } from "@/components/CatalogHeader";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Trophy, ClipboardList, Loader2, CheckCircle2,
    Clock, PlayCircle, Briefcase, XCircle
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

// Wrapper para manejar useSearchParams seguramente
function PerformanceContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. LEER PARÁMETROS DE URL
    const deptFilterId = searchParams.get('department');
    const initialTab = searchParams.get('tab') || "me";

    const [myReviews, setMyReviews] = useState<any[]>([]);
    const [teamReviews, setTeamReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Nombre del departamento filtrado (opcional, para mostrarlo en UI)
    // Podríamos traerlo del backend o deducirlo, por ahora mostramos un aviso genérico si hay filtro.

    // Determinar si soy jefe
    const isManager = teamReviews.length > 0 || user?.is_staff;

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // A. Cargar MIS evaluaciones (Siempre igual)
                const resMy = await apiClient.get('/api/performance/reviews/?scope=received');
                setMyReviews(Array.isArray(resMy.data) ? resMy.data : resMy.data.results);

                // B. Cargar evaluaciones DE MI EQUIPO (Con filtro opcional)
                if (user?.person) {
                    let url = '/api/performance/reviews/?scope=given';

                    // 🚨 APLICAR FILTRO SI EXISTE 🚨
                    if (deptFilterId) {
                        url += `&department=${deptFilterId}`;
                    }

                    const resTeam = await apiClient.get(url);
                    setTeamReviews(Array.isArray(resTeam.data) ? resTeam.data : resTeam.data.results);
                }
            } catch (error) {
                console.error("Error cargando datos", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, deptFilterId]); // Recargar si cambia el filtro

    // Helper de colores (Igual que antes)
    const getStatusBadge = (status: string, label: string) => { /* ... código igual ... */ };

    // Función para limpiar el filtro
    const clearFilter = () => {
        router.push('/performance?tab=team'); // Mantenemos el tab pero quitamos el dept
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    // Calculamos el tab por defecto:
    // Si viene en URL -> usar ese.
    // Si no, y soy manager con pendientes -> 'team'.
    // Si no -> 'me'.
    const defaultTabValue = initialTab === 'team' && isManager ? 'team' : (isManager && teamReviews.some(r => r.status === 'BOR') ? "team" : "me");

    return (
        <>
            <CatalogHeader items={[{ name: "Gestión de Desempeño", href: "/performance" }]} hideSidebarTrigger />

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950">

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Evaluaciones</h1>
                        <p className="text-muted-foreground">Historial de desempeño y gestión de equipo.</p>
                    </div>

                    {/* AVISO DE FILTRO ACTIVO */}
                    {deptFilterId && (
                        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 text-sm">
                            <span>Filtrado por Departamento</span>
                            <button onClick={clearFilter} className="hover:text-indigo-900">
                                <XCircle className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue={defaultTabValue} className="w-full">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                        <TabsTrigger value="me" className="gap-2">
                            <Trophy className="h-4 w-4" /> Mis Resultados
                        </TabsTrigger>
                        {isManager && (
                            <TabsTrigger value="team" className="gap-2">
                                <ClipboardList className="h-4 w-4" /> Evaluar Equipo
                                {teamReviews.filter(r => r.status === 'BOR').length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                        {teamReviews.filter(r => r.status === 'BOR').length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* --- PESTAÑA 1: MIS RESULTADOS (Igual que antes) --- */}
                    <TabsContent value="me" className="mt-6 space-y-4">
                        {/* ... código de tarjetas de empleado ... */}
                        {/* Copia exactamente lo que tenías aquí */}
                        {myReviews.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                <p className="text-muted-foreground">No tienes evaluaciones registradas aún.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myReviews.map((review) => (
                                    <Card key={review.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push(`/performance/evaluate/${review.id}`)}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="font-normal">{review.period_name}</Badge>
                                                {review.final_score && (
                                                    <div className="text-right">
                                                        <span className="block text-2xl font-bold text-indigo-600">{Number(review.final_score).toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">{review.position_name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {review.department_name || "Sin Departamento"}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm text-muted-foreground mb-4">Evaluado por: <span className="font-medium text-foreground">{review.evaluator_name}</span></div>
                                            <div className="flex items-center justify-between mt-2 pt-4 border-t">
                                                {/* getStatusBadge logic here inline or imported */}
                                                <Badge variant="outline">{review.status_display}</Badge>
                                                <Button size="sm" variant="ghost" className="text-xs h-8">{review.status === 'ENV' ? "Firmar" : "Ver detalles"}</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* --- PESTAÑA 2: EVALUAR EQUIPO --- */}
                    {isManager && (
                        <TabsContent value="team" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Listado de Personal a Cargo</CardTitle>
                                    <CardDescription>
                                        {deptFilterId
                                            ? "Mostrando evaluaciones filtradas por el equipo seleccionado."
                                            : "Todas las evaluaciones pendientes bajo su supervisión."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* ... TABLA (Copia el código de la tabla que ya tenías) ... */}
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead>Empleado</TableHead>
                                                    <TableHead>Cargo</TableHead>
                                                    <TableHead>Periodo</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="text-right">Acción</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {teamReviews.length === 0 ? (
                                                    <TableRow><TableCell colSpan={5} className="text-center py-8">No se encontraron evaluaciones.</TableCell></TableRow>
                                                ) : (
                                                    teamReviews.map((review) => (
                                                        <TableRow key={review.id}>
                                                            <TableCell className="font-medium">{review.employee_name}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm">{review.position_name}</span>
                                                                    <span className="text-xs text-muted-foreground">{review.department_name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{review.period_name}</TableCell>
                                                            <TableCell><Badge variant="outline">{review.status_display}</Badge></TableCell>
                                                            <TableCell className="text-right">
                                                                <Button size="sm" variant={review.status === 'BOR' ? 'default' : 'ghost'} onClick={() => router.push(`/performance/evaluate/${review.id}`)}>
                                                                    {review.status === 'BOR' ? <><PlayCircle className="mr-2 h-4 w-4" /> Evaluar</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Ver</>}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </>
    );
}

// Componente Principal (Export default)
// Necesario para Suspense boundaries en Next.js al usar useSearchParams
export default function PerformanceHubPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <PerformanceContent />
        </Suspense>
    );
}