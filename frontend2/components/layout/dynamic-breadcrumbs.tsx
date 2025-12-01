"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const routeNameMap: Record<string, string> = {
    admin: "Administración",
    dashboard: "Dashboard",
    personnel: "Personal",
    employees: "Empleados",
    people: "Personas",
    organization: "Organización",
    departments: "Departamentos",
    "job-titles": "Títulos de Cargo",
    positions: "Posiciones",
    training: "Capacitación",
    courses: "Cursos",
    ats: "Reclutamiento",
    jobs: "Vacantes",
    candidates: "Candidatos",
    performance: "Evaluación",
    periods: "Periodos",
    config: "Configuración",
    general: "General",
    employment: "Empleo",
    talent: "Talento",
    employee: "Empleado",
    "personal-data": "Datos Personales",
    "job-data": "Datos del Puesto",
    compensation: "Compensación",
    "time-management": "Gestión del Tiempo",
    benefits: "Beneficios",
    "performance-goals": "Rendimiento y Metas",
    succession: "Sucesión",
    "learning-development": "Aprendizaje y Desarrollo",
    "talent-profile": "Perfil de Talento",
    // Catalogs
    countries: "Países",
    genders: "Géneros",
    "marital-statuses": "Estados Civiles",
    "address-types": "Tipos de Dirección",
    "phone-types": "Tipos de Teléfono",
    "phone-carriers": "Operadoras Telefónicas",
    "email-types": "Tipos de Email",
    banks: "Bancos",
    "bank-account-types": "Tipos de Cuenta Bancaria",
    "relationship-types": "Tipos de Relación",
    states: "Estados",
    "phone-carrier-codes": "Códigos de Operadora",
};

import { useBreadcrumb } from "@/context/breadcrumb-context";

export function DynamicBreadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");
    const { labels } = useBreadcrumb();

    // If we are at root, don't show breadcrumbs or show Home?
    // Usually dashboard is /admin/dashboard.

    return (
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/">Inicio</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {segments.length > 0 && <BreadcrumbSeparator />}

                {segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    const href = `/${segments.slice(0, index + 1).join("/")}`;
                    // Check context for override (try both with and without trailing slash), then map, then fallback
                    const name = labels[href] || labels[href + "/"] || routeNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

                    return (
                        <Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{name}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{name}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
