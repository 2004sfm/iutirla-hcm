"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Users,
    TrendingUp,
    Briefcase,
    ArrowUpRight,
    ArrowDownRight,
    GraduationCap,
    ClipboardCheck,
    UserPlus,
    BookOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Label, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/lib/api-client";
import Link from "next/link";

interface DashboardStats {
    employees: {
        total: number;
        active: number;
        change: number;
    };
    courses: {
        total: number;
        active_enrollments: number;
        change: number;
    };
    performance_reviews: {
        total: number;
        pending: number;
        completed: number;
    };
    recruitment: {
        active_jobs: number;
        total_candidates: number;
        new_this_month: number;
    };
}

// Colores del brand theme
const BRAND_COLORS = {
    primary: "#F213A4",
    secondary: "#15BF0F",
    tertiary: "#F29F05",
};

const dashboardChartConfig = {
    empleados: {
        label: "Empleados Activos",
        color: "hsl(var(--brand-primary))",
    },
    inscritos: {
        label: "Personal Inscrito",
        color: "hsl(var(--brand-secondary))",
    },
    nuevos: {
        label: "Nuevas Contrataciones",
        color: "hsl(var(--brand-tertiary))",
    },
} satisfies ChartConfig;

const PIE_COLORS = [BRAND_COLORS.primary, BRAND_COLORS.secondary, BRAND_COLORS.tertiary, "#8884d8", "#82ca9d", "#ffc658"];

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // State para datos de charts (se cargarán desde el backend)
    const [employeeTrendData, setEmployeeTrendData] = useState<any[]>([]);
    const [courseEnrollmentData, setCourseEnrollmentData] = useState<any[]>([]);
    const [departmentData, setDepartmentData] = useState<any[]>([]);
    const [hiringData, setHiringData] = useState<any[]>([]);
    const [activeDepartment, setActiveDepartment] = useState<string>("General");

    const departmentConfig = useMemo(() => {
        const config: ChartConfig = {};
        departmentData.forEach((item) => {
            config[item.name] = {
                label: item.name,
                color: item.fill,
            };
        });
        return config;
    }, [departmentData]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            // Cargar datos reales de varios endpoints con paginación completa
            const [employeesRes, coursesRes, reviewsRes, jobsRes, candidatesRes, departmentsRes, participantsRes] = await Promise.all([
                apiClient.get("/api/employment/employments/?page_size=1000").catch((e) => { console.error("Error loading employees:", e); return { data: { results: [] } }; }),
                apiClient.get("/api/training/courses/?page_size=1000").catch((e) => { console.error("Error loading courses:", e); return { data: { results: [] } }; }),
                apiClient.get("/api/performance/reviews/?page_size=1000").catch((e) => { console.error("Error loading reviews:", e); return { data: { results: [] } }; }),
                apiClient.get("/api/ats/jobs/").catch((e) => { console.error("Error loading jobs:", e); return { data: { results: [] } }; }),
                apiClient.get("/api/ats/candidates/?page_size=1000").catch((e) => { console.error("Error loading candidates:", e); return { data: { results: [] } }; }),
                apiClient.get("/api/organization/departments/").catch((e) => { console.error("Error loading departments:", e); return { data: { results: [] } }; }),
                apiClient.get("/api/training/participants/?page_size=1000").catch((e) => { console.error("Error loading participants:", e); return { data: { results: [] } }; }),
            ]);

            const employees = employeesRes.data?.results || [];
            const courses = coursesRes.data?.results || [];
            const reviews = reviewsRes.data?.results || [];
            const jobs = jobsRes.data?.results || [];
            const candidates = candidatesRes.data?.results || [];
            const departments = departmentsRes.data?.results || [];
            const participants = participantsRes.data?.results || [];

            console.log("Dashboard Data Loaded:", {
                employees: employees.length,
                courses: courses.length,
                reviews: reviews.length,
                jobs: jobs.length,
                candidates: candidates.length,
                participants: participants.length,
            });

            // Estadísticas generales
            const employeeCount = employees.length;
            const activeJobs = jobs.filter((j: any) => j.status === "PUBLISHED").length;
            const pendingReviews = reviews.filter((r: any) => r.status === "BOR").length;
            const completedReviews = reviews.filter((r: any) => r.status === "ACE").length;

            // Calcular tendencia de empleados por mes (últimos 6 meses)
            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const now = new Date();
            const employeeTrend: any[] = [];

            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = monthNames[targetDate.getMonth()];

                const employeesUpToMonth = employees.filter((emp: any) => {
                    if (!emp.hire_date) return true; // Contar empleados sin fecha como existentes
                    const hireDate = new Date(emp.hire_date);
                    return hireDate <= targetDate;
                }).length;

                const newHires = employees.filter((emp: any) => {
                    if (!emp.hire_date) return false;
                    const hireDate = new Date(emp.hire_date);
                    return hireDate.getMonth() === targetDate.getMonth() &&
                        hireDate.getFullYear() === targetDate.getFullYear();
                }).length;

                employeeTrend.push({
                    mes: monthName,
                    empleados: employeesUpToMonth || 0,
                    nuevos: newHires || 0
                });
            }
            setEmployeeTrendData(employeeTrend);
            setHiringData(employeeTrend);

            // Calcular inscripciones en cursos por mes
            const courseEnrollments: any[] = [];
            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = monthNames[targetDate.getMonth()];

                const enrollmentsUpToMonth = participants.filter((p: any) => {
                    if (!p.enrollment_date && !p.created_at) return true; // Contar participantes sin fecha
                    const enrollDate = new Date(p.enrollment_date || p.created_at);
                    return enrollDate <= targetDate;
                }).length;

                courseEnrollments.push({ mes: monthName, inscritos: enrollmentsUpToMonth || 0 });
            }
            setCourseEnrollmentData(courseEnrollments);

            // Calcular distribución por departamento
            const deptDistribution = new Map<string, number>();
            employees.forEach((emp: any) => {
                const deptName = emp.department_name || "Sin Departamento";
                deptDistribution.set(deptName, (deptDistribution.get(deptName) || 0) + 1);
            });

            const deptData = Array.from(deptDistribution.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6)
                .map((item, index) => ({
                    ...item,
                    fill: PIE_COLORS[index % PIE_COLORS.length]
                }));

            // Si no hay datos de departamentos, crear datos de ejemplo
            if (deptData.length === 0 && employees.length > 0) {
                deptData.push({
                    name: "General",
                    value: employees.length,
                    fill: PIE_COLORS[0]
                } as any);
            }
            setDepartmentData(deptData);

            // Calcular estadísticas
            const lastMonthParticipants = courseEnrollments[courseEnrollments.length - 1]?.inscritos || 0;
            const prevMonthParticipants = courseEnrollments[courseEnrollments.length - 2]?.inscritos || 0;
            const courseGrowth = prevMonthParticipants > 0
                ? ((lastMonthParticipants - prevMonthParticipants) / prevMonthParticipants * 100).toFixed(1)
                : "0";

            const lastMonthEmployees = employeeTrend[employeeTrend.length - 1]?.empleados || 0;
            const prevMonthEmployees = employeeTrend[employeeTrend.length - 2]?.empleados || 0;
            const employeeGrowth = prevMonthEmployees > 0
                ? ((lastMonthEmployees - prevMonthEmployees) / prevMonthEmployees * 100).toFixed(1)
                : "0";

            setStats({
                employees: {
                    total: employeeCount,
                    active: employeeCount,
                    change: parseFloat(employeeGrowth),
                },
                courses: {
                    total: courses.length,
                    active_enrollments: lastMonthParticipants,
                    change: parseFloat(courseGrowth),
                },
                performance_reviews: {
                    total: reviews.length,
                    pending: pendingReviews,
                    completed: completedReviews,
                },
                recruitment: {
                    active_jobs: activeJobs,
                    total_candidates: candidates.length,
                    new_this_month: candidates.filter((c: any) => {
                        if (!c.created_at) return false;
                        const created = new Date(c.created_at);
                        return created.getMonth() === now.getMonth() &&
                            created.getFullYear() === now.getFullYear();
                    }).length,
                },
            });
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }

    // Interactive Pie Chart Logic
    const activeIndex = useMemo(
        () => departmentData.findIndex((item) => item.name === activeDepartment),
        [activeDepartment, departmentData]
    );
    const departments = useMemo(() => departmentData.map((item) => item.name), [departmentData]);

    useEffect(() => {
        if (departmentData.length > 0 && !departments.includes(activeDepartment)) {
            setActiveDepartment(departmentData[0].name);
        }
    }, [departmentData, activeDepartment, departments]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Cargando dashboard...</p>
            </div>
        );
    }

    const statsCards = [
        {
            title: "Total Empleados",
            value: stats?.employees.total.toString() || "0",
            change: stats?.employees.change ? `${stats.employees.change > 0 ? '+' : ''}${stats.employees.change.toFixed(1)}%` : "0%",
            isPositive: (stats?.employees.change || 0) >= 0,
            icon: <Users className="w-6 h-6" />,
            color: "brand-primary",
            link: "/admin/employment/employees",
        },
        {
            title: "Cursos de Capacitación",
            value: stats?.courses.total.toString() || "0",
            change: `${stats?.courses.active_enrollments || 0} inscripciones`,
            isPositive: true,
            icon: <BookOpen className="w-6 h-6" />,
            color: "brand-secondary",
            link: "/admin/training/courses",
        },
        {
            title: "Evaluaciones Completadas",
            value: stats?.performance_reviews.completed.toString() || "0",
            change: `${stats?.performance_reviews.pending || 0} pendientes`,
            isPositive: (stats?.performance_reviews.pending || 0) === 0,
            icon: <ClipboardCheck className="w-6 h-6" />,
            color: "brand-tertiary",
            link: "/admin/performance/reviews",
        },
        {
            title: "Proceso de Reclutamiento",
            value: stats?.recruitment.active_jobs.toString() || "0",
            change: `${stats?.recruitment.total_candidates || 0} candidatos`,
            isPositive: (stats?.recruitment.total_candidates || 0) > 0,
            icon: <Briefcase className="w-6 h-6" />,
            color: "brand-primary",
            link: "/admin/ats/jobs",
        },
    ];



    return (
        <>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                    Bienvenido al sistema de gestión IUTIRLA - Extensión Porlamar
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {statsCards.map((stat, index) => (
                    <Link key={index} href={stat.link}>
                        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center`}
                                    style={{ backgroundColor: `hsl(var(--${stat.color}) / 0.1)` }}
                                >
                                    <div style={{ color: `hsl(var(--${stat.color}))` }}>{stat.icon}</div>
                                </div>
                                <div
                                    className={`flex items-center gap-1 text-sm font-semibold ${stat.isPositive ? "text-brand-secondary" : "text-destructive"
                                        }`}
                                >
                                    {stat.isPositive ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Employee Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Crecimiento de Personal</CardTitle>
                        <CardDescription>Empleados activos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={dashboardChartConfig} className="h-[300px] w-full">
                            <AreaChart data={employeeTrendData}>
                                <defs>
                                    <linearGradient id="colorEmpleados" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="empleados"
                                    stroke={BRAND_COLORS.primary}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorEmpleados)"
                                    name="Empleados Activos"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Course Enrollment Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Inscripciones en Capacitación</CardTitle>
                        <CardDescription>Personal inscrito en programas de formación</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={dashboardChartConfig} className="h-[300px] w-full">
                            <LineChart data={courseEnrollmentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line
                                    type="monotone"
                                    dataKey="inscritos"
                                    stroke={BRAND_COLORS.secondary}
                                    strokeWidth={3}
                                    dot={{ fill: BRAND_COLORS.secondary, r: 4 }}
                                    name="Personal Inscrito"
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Department Distribution */}
                <Card data-chart="pie-interactive" className="flex flex-col">
                    <ChartStyle id="pie-interactive" config={departmentConfig} />
                    <CardHeader className="flex-row items-start space-y-0 pb-0">
                        <div className="grid gap-1">
                            <CardTitle>Distribución por Departamento</CardTitle>
                            <CardDescription>Empleados por área organizacional</CardDescription>
                        </div>
                        <Select value={activeDepartment} onValueChange={setActiveDepartment}>
                            <SelectTrigger
                                className="ml-auto h-7 w-[250px] rounded-lg pl-2.5"
                                aria-label="Select a value"
                            >
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent align="end" className="rounded-xl">
                                {departments.map((key) => {
                                    const config = departmentConfig[key];
                                    if (!config) return null;
                                    return (
                                        <SelectItem
                                            key={key}
                                            value={key}
                                            className="rounded-lg [&_span]:flex"
                                        >
                                            <div className="flex items-center gap-2 text-xs">
                                                <span
                                                    className="flex h-3 w-3 shrink-0 rounded-sm"
                                                    style={{
                                                        backgroundColor: config.color,
                                                    }}
                                                />
                                                {config?.label}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex flex-1 justify-center pb-0">
                        <ChartContainer
                            id="pie-interactive"
                            config={departmentConfig}
                            className="mx-auto aspect-square w-full max-w-[300px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={departmentData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    strokeWidth={5}
                                    // @ts-ignore
                                    activeIndex={activeIndex}
                                    activeShape={({
                                        outerRadius = 0,
                                        ...props
                                    }: any) => (
                                        <g>
                                            <Sector {...props} outerRadius={outerRadius + 10} />
                                            <Sector
                                                {...props}
                                                outerRadius={outerRadius + 25}
                                                innerRadius={outerRadius + 12}
                                            />
                                        </g>
                                    )}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {departmentData[activeIndex]?.value.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground"
                                                        >
                                                            Empleados
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* New Hires Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Nuevas Contrataciones</CardTitle>
                        <CardDescription>Personal incorporado mensualmente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={dashboardChartConfig} className="h-[300px] w-full">
                            <BarChart data={hiringData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey="nuevos"
                                    fill={BRAND_COLORS.tertiary}
                                    radius={[8, 8, 0, 0]}
                                    name="Nuevas Contrataciones"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/admin/personnel/employees/new">
                            <button className="w-full bg-brand-primary text-brand-primary-foreground p-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Nuevo Empleado
                            </button>
                        </Link>
                        <Link href="/admin/courses/new">
                            <button className="w-full bg-brand-secondary text-brand-secondary-foreground p-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Nuevo Curso
                            </button>
                        </Link>
                        <Link href="/admin/ats/jobs/new">
                            <button className="w-full bg-brand-tertiary text-brand-tertiary-foreground p-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Nueva Vacante
                            </button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                {
                                    action: "Nueva evaluación completada",
                                    person: "María González",
                                    time: "Hace 15 minutos",
                                    color: "brand-primary",
                                },
                                {
                                    action: "Candidato postulado",
                                    person: "Sistema ATS",
                                    time: "Hace 1 hora",
                                    color: "brand-secondary",
                                },
                                {
                                    action: "Curso publicado",
                                    person: "Carlos Rodríguez",
                                    time: "Hace 2 horas",
                                    color: "brand-tertiary",
                                },
                                {
                                    action: "Empleado registrado",
                                    person: "Juan Pérez",
                                    time: "Hace 3 horas",
                                    color: "brand-primary",
                                },
                            ].map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 pb-4 border-b border-border last:border-b-0 last:pb-0"
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full mt-2 shrink-0`}
                                        style={{ backgroundColor: `hsl(var(--${activity.color}))` }}
                                    ></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground font-medium">{activity.action}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.person} • {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
