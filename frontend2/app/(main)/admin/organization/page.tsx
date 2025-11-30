"use client";

import { CatalogCard } from "@/components/catalogs/catalog-card";
import { Input } from "@/components/ui/input";
import {
    Building2,
    Briefcase,
    Network,
    Search,
} from "lucide-react";
import { useState } from "react";

const catalogs = [
    {
        title: "Departamentos",
        description: "Gestión de departamentos y unidades organizativas",
        icon: Building2,
        href: "/admin/organization/departments",
        gradient: "from-blue-900 via-blue-700 to-blue-500",
        iconColor: "text-blue-200/90"
    },
    {
        title: "Títulos de Cargo",
        description: "Catálogo de títulos y denominaciones de cargo",
        icon: Briefcase,
        href: "/admin/organization/job-titles",
        gradient: "from-emerald-900 via-emerald-700 to-emerald-500",
        iconColor: "text-emerald-200/90"
    },
    {
        title: "Posiciones",
        description: "Gestión de posiciones y estructura organizativa",
        icon: Network,
        href: "/admin/organization/positions",
        gradient: "from-purple-900 via-purple-700 to-purple-500",
        iconColor: "text-purple-200/90"
    },
];

export default function OrganizationConfigPage() {
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
                    <h1 className="text-3xl font-bold text-foreground">Organización</h1>
                    <p className="text-muted-foreground">
                        Gestión de la estructura organizativa
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
