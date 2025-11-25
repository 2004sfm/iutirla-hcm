'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { CatalogHeader } from "@/components/CatalogHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users, UserPlus, UserMinus, AlertTriangle,
    Briefcase, ArrowUpRight, ArrowDownRight, ExternalLink
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link'; // <--- IMPORTANTE

// 1. ACTUALIZAR TIPOS
interface DashboardStats {
    headcount: number;
    new_hires: number;
    exits: number;
    pending_users: number;
    department_distribution: { position__department__name: string, count: number }[];
    // Actualizado para coincidir con el nuevo backend
    expiring_soon: {
        id: number;
        person_name: string;
        person_document: string;
        end_date: string;
    }[];
}

export default function DashboardPage() {
    // ... (El resto de tu lógica de carga se mantiene igual) ...
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await apiClient.get('/api/employment/employments/dashboard_stats/');
                setStats(data);
            } catch (error) {
                console.error("Error cargando dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const breadcrumbItems = [{ name: "Panel de Control", href: "/admin/dashboard" }];

    if (loading) return <DashboardSkeleton />;

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

                {/* ... SECCIÓN 1: KPIs (Igual que antes) ... */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* ... Tus tarjetas de KPI ... */}
                    <KpiCard title="Total Empleados" value={stats?.headcount || 0} icon={Users} description="Personal activo" />
                    <KpiCard title="Nuevos Ingresos" value={stats?.new_hires || 0} icon={UserPlus} description="En el mes actual" trend="up" />
                    <KpiCard title="Salidas" value={stats?.exits || 0} icon={UserMinus} description="En el mes actual" trend="down" />
                    <KpiCard title="Sin Usuario" value={stats?.pending_users || 0} icon={AlertTriangle} description="Requieren atención" className="border-l-4 border-l-amber-500" />
                </div>

                {/* SECCIÓN 2: DETALLES */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                    {/* ... Gráfico de Departamentos (Igual que antes) ... */}
                    <Card className="col-span-4">
                        <CardHeader><CardTitle>Distribución por Departamento</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {stats?.department_distribution.map((dept, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{dept.position__department__name || "Sin Departamento"}</span>
                                        <span className="text-muted-foreground">{dept.count} emp.</span>
                                    </div>
                                    <Progress value={(dept.count / (stats?.headcount || 1)) * 100} className="h-2" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* 2. LISTA DE VENCIMIENTOS CON LINK Y CÉDULA */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Vencimientos Próximos</CardTitle>
                            <CardDescription>Contratos por finalizar (30 días).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {stats?.expiring_soon.length ? (
                                    stats.expiring_soon.map((item) => (

                                        // ENVOLVEMOS EN UN LINK
                                        <Link
                                            key={item.id}
                                            href={`/admin/personnel/employees/${item.id}`}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600 dark:text-orange-400">
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    {/* NOMBRE */}
                                                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                                        {item.person_name}
                                                    </p>

                                                    {/* CÉDULA (Debajo del nombre) */}
                                                    <p className="text-xs text-muted-foreground font-mono mt-1">
                                                        {item.person_document}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                                    {new Date(item.end_date).toLocaleDateString()}
                                                </p>
                                                <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>

                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[150px] text-muted-foreground text-sm">
                                        <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                                        No hay contratos por vencer.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

// ... (Componentes auxiliares KpiCard y Skeleton se mantienen igual)
function KpiCard({ title, value, icon: Icon, description, trend, className }: any) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {description}
                    {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500 ml-1" />}
                    {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500 ml-1" />}
                </div>
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex-1 p-8 space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-7">
                <Skeleton className="col-span-4 h-[300px] rounded-xl" />
                <Skeleton className="col-span-3 h-[300px] rounded-xl" />
            </div>
        </div>
    );
}