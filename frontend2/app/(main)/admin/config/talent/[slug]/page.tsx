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
    singularName?: string;
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
        singularName: "Función de Negocio",
        icon: Briefcase,
        apiUrl: "/api/talent/business-functions/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "education-levels": {
        title: "Niveles Educativos",
        singularName: "Nivel Educativo",
        icon: GraduationCap,
        apiUrl: "/api/talent/education-levels/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "fields-of-study": {
        title: "Campos de Estudio",
        singularName: "Campo de Estudio",
        icon: BookOpen,
        apiUrl: "/api/talent/fields-of-study/",
        fields: [
            {
                name: "education_level",
                label: "Nivel Educativo",
                type: "select",
                required: true,
                optionsUrl: "/api/talent/education-levels/",
                optionLabelKey: "name",
                optionValueKey: "id",
            },
            {
                name: "name",
                label: "Nombre",
                type: "text",
                required: true,
            },
        ],
        columns: [
            {
                accessorKey: "name",
                header: "Campo de Estudio",
                cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div>
            },
            {
                accessorKey: "education_level_name",
                header: "Nivel Educativo",
                cell: ({ row }) => <div className="truncate">{row.getValue("education_level_name") || "Sin nivel"}</div>
            },
        ],
        searchKey: "name",
    },
    languages: {
        title: "Idiomas",
        singularName: "Idioma",
        icon: Languages,
        apiUrl: "/api/talent/languages/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    proficiencies: {
        title: "Niveles de Dominio de Idioma",
        singularName: "Nivel de Dominio",
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
            singularName={config.singularName}
        />
    );
}
