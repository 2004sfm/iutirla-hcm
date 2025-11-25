'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';

// UI Components
import { CatalogHeader } from "@/components/CatalogHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
    Loader2, ArrowLeft, Users, Shield,
    User, ClipboardList, Network
} from "lucide-react";

// --- TIPOS ---
interface OrgMember {
    name: string;
    position: string;
    department?: string;
    photo: string | null;
}

interface OrgData {
    me: OrgMember;
    boss: OrgMember | null;
    peers: OrgMember[];
    subordinates: OrgMember[];
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // Desempaquetado de params para Next.js 15
    const resolvedParams = use(params);
    const deptId = resolvedParams.id;

    const [data, setData] = useState<OrgData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- 1. CARGAR DATOS ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Solicitamos el organigrama filtrado por este departamento específico
                // Esto resuelve el caso de tener múltiples contratos
                const response = await apiClient.get(`/api/employment/employments/my_org_chart/?department_id=${deptId}`);
                setData(response.data);
            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la estructura del equipo. Verifique su conexión o permisos.");
            } finally {
                setLoading(false);
            }
        };

        if (deptId) fetchData();
    }, [deptId]);


    // --- 2. ACCIÓN: IR A EVALUACIONES ---
    const goToPerformance = () => {
        // Redirige al Hub de Performance, abriendo la pestaña de equipo y filtrando por este Depto.
        router.push(`/performance?tab=team&department=${deptId}`);
    };


    // --- RENDERIZADO ---

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (error || !data) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full space-y-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "Información no disponible"}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => router.back()}>Volver</Button>
            </div>
        );
    }

    return (
        <>
            <CatalogHeader items={[
                { name: "Mi Organización", href: "/teams" },
                { name: data.me.department || "Detalle de Equipo", href: "#" }
            ]} hideSidebarTrigger />

            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8 bg-slate-50/50 dark:bg-slate-950 min-h-full">

                {/* ENCABEZADO DE LA PÁGINA */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/teams')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {data.me.department}
                            </h1>
                            <p className="text-sm text-muted-foreground">Estructura y relaciones laborales.</p>
                        </div>
                    </div>

                    {/* 🚨 BOTÓN INTELIGENTE: Solo aparece si tienes subordinados en este equipo */}
                    {data.subordinates.length > 0 && (
                        <Button onClick={goToPerformance} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <ClipboardList className="h-4 w-4" />
                            Gestionar Evaluaciones
                        </Button>
                    )}
                </div>

                <div className="max-w-5xl mx-auto space-y-12 pb-12">

                    {/* SECCIÓN 1: LIDERAZGO (Arriba) */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            <Shield className="h-4 w-4 text-indigo-500" /> Reportas Directamente A
                        </div>

                        {data.boss ? (
                            <MemberCard member={data.boss} variant="boss" />
                        ) : (
                            <div className="p-6 border-2 border-dashed rounded-xl text-muted-foreground text-sm bg-white/50 w-72 text-center">
                                Esta posición no tiene supervisor directo asignado en el sistema.
                            </div>
                        )}

                        {/* Línea conectora vertical */}
                        <div className="h-10 w-0.5 bg-slate-300 dark:bg-slate-700 mt-2"></div>
                    </div>

                    {/* SECCIÓN 2: TU POSICIÓN (Centro) */}
                    <div className="flex flex-col items-center">
                        <MemberCard member={data.me} variant="me" />

                        {/* Conector hacia abajo solo si hay subordinados */}
                        {data.subordinates.length > 0 && (
                            <div className="h-10 w-0.5 bg-slate-300 dark:bg-slate-700 mt-2"></div>
                        )}
                    </div>

                    {/* SECCIÓN 3: TU EQUIPO (Abajo) */}
                    {data.subordinates.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                <Users className="h-4 w-4 text-indigo-500" /> Tu Equipo a Cargo
                            </div>

                            {/* Línea horizontal conectora (Tree style) */}
                            <div className="relative flex justify-center">
                                <div className="absolute top-0 w-[80%] border-t border-slate-300 dark:border-slate-700"></div>
                                {/* Pequeño conector vertical para unir la línea horizontal con la tarjeta de arriba */}
                                <div className="absolute -top-4 h-4 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-8 pt-6">
                                {data.subordinates.map((sub, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700 -mt-6 mb-2"></div>
                                        <MemberCard member={sub} variant="subordinate" />
                                    </div>
                                ))}
                            </div>

                            <Separator className="mt-12" />
                        </div>
                    )}

                    {/* SECCIÓN 4: PARES (Lateral / Abajo del todo) */}
                    {data.peers.length > 0 && (
                        <div className="space-y-6 pt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Network className="h-4 w-4" /> Otros miembros del equipo ({data.peers.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {data.peers.map((peer, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={peer.photo || ""} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">{peer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium truncate">{peer.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{peer.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// --- COMPONENTE TARJETA VISUAL ---
function MemberCard({ member, variant }: { member: OrgMember, variant: 'boss' | 'me' | 'subordinate' }) {
    const isMe = variant === 'me';
    const isBoss = variant === 'boss';

    return (
        <Card className={cn(
            "w-72 text-center transition-all relative overflow-hidden",
            isMe ? "border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-xl scale-105 z-10" : "hover:shadow-lg hover:-translate-y-1",
            isBoss ? "bg-slate-50/80 border-slate-200" : "bg-white dark:bg-slate-900"
        )}>
            {/* Decoración superior */}
            <div className={cn("h-1.5 w-full",
                isMe ? "bg-indigo-500" : isBoss ? "bg-slate-400" : "bg-teal-500"
            )} />

            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
                <Avatar className={cn("h-20 w-20 border-4 border-white shadow-sm", isMe ? "h-24 w-24" : "")}>
                    <AvatarImage src={member.photo || ""} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-600">
                        {member.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-1 w-full px-2">
                    <h4 className="font-bold text-lg leading-tight truncate" title={member.name}>{member.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide truncate" title={member.position}>
                        {member.position}
                    </p>
                </div>

                {isMe && <Badge className="bg-indigo-600 mt-1 shadow-sm">Tú</Badge>}
                {isBoss && <Badge variant="outline" className="mt-1 border-slate-400 text-slate-600 bg-slate-100">Supervisor</Badge>}
            </CardContent>
        </Card>
    );
}