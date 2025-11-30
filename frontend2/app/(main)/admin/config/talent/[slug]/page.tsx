"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { notFound } from "next/navigation";
import { use } from "react";

interface CatalogConfig {
    title: string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
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
        apiUrl: "/api/talent/business-functions/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "education-levels": {
        title: "Niveles Educativos",
        apiUrl: "/api/talent/education-levels/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "fields-of-study": {
        title: "Campos de Estudio",
        apiUrl: "/api/talent/fields-of-study/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    languages: {
        title: "Idiomas",
        apiUrl: "/api/talent/languages/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    proficiencies: {
        title: "Niveles de Dominio de Idioma",
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
            apiUrl={config.apiUrl}
            fields={config.fields}
            columns={config.columns}
            searchKey={config.searchKey}
        />
    );
}
