"use client";

import {
    Users,
    GraduationCap,
    Briefcase,
    Settings,
    Gauge,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
    const { user } = useAuth();
    const isAdmin = user?.is_staff;

    const adminCards = [
        {
            title: "Gestión de Personal",
            description: "Administra empleados, contratos y expedientes.",
            icon: Users,
            href: "/admin/personnel/employees",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Evaluación de Desempeño",
            description: "Gestiona períodos, competencias y revisiones.",
            icon: Gauge,
            href: "/admin/performance/periods",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Capacitación y Cursos",
            description: "Catálogo de cursos y planes de formación.",
            icon: BookOpen,
            href: "/admin/training",
            color: "text-orange-500",
            bg: "bg-orange-50"
        },
        {
            title: "Reclutamiento (ATS)",
            description: "Gestiona vacantes y candidatos.",
            icon: Briefcase,
            href: "/admin/ats/jobs",
            color: "text-green-500",
            bg: "bg-green-50"
        },
        {
            title: "Configuración",
            description: "Ajustes generales y catálogos del sistema.",
            icon: Settings,
            href: "/admin/config/general",
            color: "text-slate-500",
            bg: "bg-slate-50"
        }
    ];

    const employeeCards = [
        {
            title: "Mi Desempeño",
            description: "Ver mis evaluaciones y objetivos.",
            icon: Gauge,
            href: "/employee/performance",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Mi Equipo",
            description: "Ver miembros de mi departamento.",
            icon: Users,
            href: "/employee/teams",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Capacitación",
            description: "Mis cursos y planes de aprendizaje.",
            icon: BookOpen,
            href: "/training",
            color: "text-orange-500",
            bg: "bg-orange-50"
        }
    ];

    const cards = isAdmin ? adminCards : employeeCards;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido al Portal HCM</h1>
                <p className="text-muted-foreground mt-2">
                    Selecciona una opción para comenzar a gestionar tu organización.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="group relative flex flex-col p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-brand-primary/50"
                    >
                        <div className={`p-3 w-fit rounded-lg ${card.bg} ${card.color} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">
                            {card.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {card.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
