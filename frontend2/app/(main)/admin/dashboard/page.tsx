import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
    Users,
    TrendingUp,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export default async function DashboardPage() {
    const stats = [
        {
            title: "Total Empleados",
            value: "248",
            change: "+12%",
            isPositive: true,
            icon: <Users className="w-6 h-6" />,
            color: "brand-primary"
        },
        {
            title: "Estudiantes Activos",
            value: "1,842",
            change: "+5%",
            isPositive: true,
            icon: <TrendingUp className="w-6 h-6" />,
            color: "brand-secondary"
        },
        {
            title: "Eventos Este Mes",
            value: "24",
            change: "-3%",
            isPositive: false,
            icon: <Calendar className="w-6 h-6" />,
            color: "brand-tertiary"
        },
        {
            title: "Presupuesto",
            value: "$45.2K",
            change: "+18%",
            isPositive: true,
            icon: <DollarSign className="w-6 h-6" />,
            color: "brand-primary"
        }
    ];

    return (
        <>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Bienvenido al sistema de gestión IUTIRLA
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                                <div className={`text-${stat.color}`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${stat.isPositive ? 'text-brand-secondary' : 'text-destructive'
                                }`}>
                                {stat.isPositive ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">
                            {stat.value}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {stat.title}
                        </p>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">
                        Actividad Reciente
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                action: "Nuevo empleado registrado",
                                person: "Juan Pérez",
                                time: "Hace 5 minutos",
                                color: "brand-primary"
                            },
                            {
                                action: "Proyecto completado",
                                person: "María González",
                                time: "Hace 1 hora",
                                color: "brand-secondary"
                            },
                            {
                                action: "Reunión programada",
                                person: "Carlos Rodríguez",
                                time: "Hace 2 horas",
                                color: "brand-tertiary"
                            },
                            {
                                action: "Documento subido",
                                person: "Ana Martínez",
                                time: "Hace 3 horas",
                                color: "brand-primary"
                            }
                        ].map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                                <div className={`w-2 h-2 bg-${activity.color} rounded-full mt-2 shrink-0`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground font-medium">
                                        {activity.action}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.person} • {activity.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">
                        Acciones Rápidas
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Nuevo Empleado", color: "brand-primary" },
                            { label: "Nuevo Estudiante", color: "brand-secondary" },
                            { label: "Crear Evento", color: "brand-tertiary" },
                            { label: "Generar Reporte", color: "brand-primary" }
                        ].map((action, index) => (
                            <button
                                key={index}
                                className={`bg-${action.color} text-${action.color}-foreground p-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Upcoming Events */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-3">
                            Próximos Eventos
                        </h3>
                        <div className="space-y-3">
                            {[
                                { title: "Reunión de Departamento", date: "Mañana, 10:00 AM" },
                                { title: "Entrevista de Candidato", date: "Pasado mañana, 2:00 PM" },
                                { title: "Capacitación Personal", date: "Viernes, 9:00 AM" }
                            ].map((event, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {event.date}
                                        </p>
                                    </div>
                                    <Calendar className="w-4 h-4 text-brand-primary" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-6 bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Sistema de Gestión IUTIRLA
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Este es un dashboard de ejemplo que muestra la implementación del sidebar y header basados  en AdminLTE 3,
                            adaptados con los colores oficiales de IUTIRLA del Manual de Organización.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-full">
                                Primary: #F213A4
                            </span>
                            <span className="px-3 py-1 bg-brand-secondary/10 text-brand-secondary text-xs font-semibold rounded-full">
                                Secondary: #15BF0F
                            </span>
                            <span className="px-3 py-1 bg-brand-tertiary/10 text-brand-tertiary text-xs font-semibold rounded-full">
                                Tertiary: #F29F05
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
