"use client";

import { CatalogCard } from "@/components/catalogs/catalog-card";
import { Input } from "@/components/ui/input";
import {
    Briefcase,
    GraduationCap,
    BookOpen,
    Languages,
    BarChart,
    Search,
} from "lucide-react";
import { useState } from "react";

const catalogs = [
    {
        title: "Funciones de Negocio",
        description: "Áreas funcionales y de negocio",
        icon: Briefcase,
        href: "/admin/config/talent/business-functions",
        gradient: "from-blue-900 via-blue-700 to-blue-500",
        iconColor: "text-blue-200/90"
    },
    {
        title: "Niveles Educativos",
        description: "Grados académicos y niveles de instrucción",
        icon: GraduationCap,
        href: "/admin/config/talent/education-levels",
        gradient: "from-emerald-900 via-emerald-700 to-emerald-500",
        iconColor: "text-emerald-200/90"
    },
    {
        title: "Campos de Estudio",
        description: "Áreas de conocimiento y especialidades",
        icon: BookOpen,
        href: "/admin/config/talent/fields-of-study",
        gradient: "from-purple-900 via-purple-700 to-purple-500",
        iconColor: "text-purple-200/90"
    },
    {
        title: "Idiomas",
        description: "Catálogo de idiomas",
        icon: Languages,
        href: "/admin/config/talent/languages",
        gradient: "from-pink-900 via-pink-700 to-pink-500",
        iconColor: "text-pink-200/90"
    },
    {
        title: "Niveles de Dominio",
        description: "Niveles de competencia lingüística (Básico, Intermedio, Avanzado)",
        icon: BarChart,
        href: "/admin/config/talent/proficiencies",
        gradient: "from-orange-900 via-orange-700 to-orange-500",
        iconColor: "text-orange-200/90"
    },
];

export default function TalentConfigPage() {
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
                    <h1 className="text-3xl font-bold text-foreground">Catálogos de Talento</h1>
                    <p className="text-muted-foreground">
                        Configuración de catálogos relacionados con habilidades y formación
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
