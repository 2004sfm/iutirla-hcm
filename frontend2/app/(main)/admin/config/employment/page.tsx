"use client";

import { CatalogCard } from "@/components/catalogs/catalog-card";
import { Input } from "@/components/ui/input";
import {
    Briefcase,
    Clock,
    Activity,
    Search,
} from "lucide-react";
import { useState } from "react";

const catalogs = [
    {
        title: "Roles",
        description: "Gestión de roles y cargos funcionales",
        icon: Briefcase,
        href: "/admin/config/employment/roles",
        gradient: "from-blue-900 via-blue-700 to-blue-500",
        iconColor: "text-blue-200/90"
    },
    {
        title: "Tipos de Empleo",
        description: "Clasificación de tipos de contratación (Tiempo completo, medio tiempo, etc.)",
        icon: Clock,
        href: "/admin/config/employment/types",
        gradient: "from-emerald-900 via-emerald-700 to-emerald-500",
        iconColor: "text-emerald-200/90"
    },
    {
        title: "Estatus de Empleo",
        description: "Estados del ciclo de vida del empleado (Activo, Suspendido, Retirado)",
        icon: Activity,
        href: "/admin/config/employment/statuses",
        gradient: "from-purple-900 via-purple-700 to-purple-500",
        iconColor: "text-purple-200/90"
    },
];

export default function EmploymentConfigPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const normalizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredCatalogs = catalogs.filter(catalog =>
        normalizeText(catalog.title).includes(normalizeText(searchQuery)) ||
        normalizeText(catalog.description).includes(normalizeText(searchQuery))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Catálogos de Empleo</h1>
                    <p className="text-muted-foreground">
                        Configuración de catálogos relacionados con la gestión laboral
                    </p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar catálogos..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCatalogs.map((catalog) => (
                    <CatalogCard
                        key={catalog.href}
                        {...catalog}
                    />
                ))}
            </div>
        </div>
    );
}
