"use client";

import {
    Users,
    GraduationCap,
    Briefcase,
    Settings,
    Gauge,
    BookOpen,
    Network,
    Building2,
    IdCard
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
    const { user } = useAuth();
    const isAdmin = user?.is_staff;

    const adminCards = [
        {
            title: "Personal",
            description: "Gestiona empleados y expedientes de tu organización.",
            icon: Users,
            href: "/admin/personnel/employees",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Departamentos",
            description: "Administra la estructura departamental.",
            icon: Building2,
            href: "/departments",
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        },
        {
            title: "Organigrama",
            description: "Visualiza la estructura organizacional completa.",
            icon: Network,
            href: "/org-chart",
            color: "text-teal-500",
            bg: "bg-teal-50"
        },
        {
            title: "Evaluación de Desempeño",
            description: "Gestiona períodos de evaluación y competencias.",
            icon: Gauge,
            href: "/performance",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Capacitación y Cursos",
            description: "Administra el catálogo de cursos y formación.",
            icon: BookOpen,
            href: "/training",
            color: "text-orange-500",
            bg: "bg-orange-50"
        },
        {
            title: "Reclutamiento",
            description: "Gestiona vacantes y procesos de selección.",
            icon: Briefcase,
            href: "/admin/ats/jobs",
            color: "text-green-500",
            bg: "bg-green-50"
        }
    ];

    const employeeCards = [
        {
            title: "Mi Expediente",
            description: "Ver y actualizar mis datos personales y profesionales.",
            icon: IdCard,
            href: "/employee/personal-data",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Mi Desempeño",
            description: "Consulta tus evaluaciones y objetivos.",
            icon: Gauge,
            href: "/performance",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Organigrama",
            description: "Visualiza la estructura de la organización.",
            icon: Network,
            href: "/org-chart",
            color: "text-teal-500",
            bg: "bg-teal-50"
        },
        {
            title: "Mi Equipo",
            description: "Conoce a los miembros de tu departamento.",
            icon: Users,
            href: "/departments",
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        },
        {
            title: "Capacitación",
            description: "Accede a tus cursos y planes de aprendizaje.",
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
