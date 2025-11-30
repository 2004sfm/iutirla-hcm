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
    roles: {
        title: "Roles",
        apiUrl: "/api/employment/roles/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    types: {
        title: "Tipos de Empleo",
        apiUrl: "/api/employment/employment-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    statuses: {
        title: "Estatus de Empleo",
        apiUrl: "/api/employment/employment-statuses/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
};

export default function EmploymentDynamicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
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
