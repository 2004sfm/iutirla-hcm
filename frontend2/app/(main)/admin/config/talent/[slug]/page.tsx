"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { notFound } from "next/navigation";
import { use } from "react";
import { Briefcase, GraduationCap, BookOpen, Languages, BarChart } from "lucide-react";

interface CatalogConfig {
    title: string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
    icon?: React.ElementType;
}

const simpleNameColumns: ColumnDef<any>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div>
    },
];

const simpleNameFields: CatalogField[] = [
    {
        name: "name",
        label: "Nombre",
        type: "text",
        required: true,
    },
];

const catalogs: Record<string, CatalogConfig> = {
    "business-functions": {
        title: "Funciones de Negocio",
        icon: Briefcase,
        apiUrl: "/api/talent/business-functions/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "education-levels": {
        title: "Niveles Educativos",
        icon: GraduationCap,
        apiUrl: "/api/talent/education-levels/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "fields-of-study": {
        title: "Campos de Estudio",
        icon: BookOpen,
        apiUrl: "/api/talent/fields-of-study/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    languages: {
        title: "Idiomas",
        icon: Languages,
        apiUrl: "/api/talent/languages/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    proficiencies: {
        title: "Niveles de Dominio de Idioma",
        icon: BarChart,
        apiUrl: "/api/talent/language-proficiencies/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
};

export default function TalentDynamicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const config = catalogs[slug];

    if (!config) {
        notFound();
    }

    return (
        <CatalogCRUD
            title={config.title}
            icon={config.icon}
            apiUrl={config.apiUrl}
            fields={config.fields}
            columns={config.columns}
            searchKey={config.searchKey}
        />
    );
}
