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
    departments: {
        title: "Departamentos",
        apiUrl: "/api/organization/departments/",
        fields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            {
                name: "parent",
                label: "Departamento Padre",
                type: "select",
                required: false,
                optionsUrl: "/api/organization/departments/",
                optionLabelKey: "name",
                optionValueKey: "id"
            },
            {
                name: "manager",
                label: "Gerente",
                type: "select",
                required: false,
                optionsUrl: "/api/organization/positions/", // Asumiendo que el gerente es una posición
                optionLabelKey: "name",
                optionValueKey: "id"
            }
        ],
        columns: [
            { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div> },
            { accessorKey: "parent.name", header: "Padre", cell: ({ row }) => <div className="truncate">{row.original.parent?.name || "-"}</div> },
        ],
        searchKey: "name",
    },
    "job-titles": {
        title: "Títulos de Cargo",
        apiUrl: "/api/organization/job-titles/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    positions: {
        title: "Posiciones",
        apiUrl: "/api/organization/positions/",
        fields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            {
                name: "department",
                label: "Departamento",
                type: "select",
                required: true,
                optionsUrl: "/api/organization/departments/",
                optionLabelKey: "name",
                optionValueKey: "id"
            },
            {
                name: "job_title",
                label: "Título de Cargo",
                type: "select",
                required: true,
                optionsUrl: "/api/organization/job-titles/",
                optionLabelKey: "name",
                optionValueKey: "id"
            },
            {
                name: "reports_to",
                label: "Reporta a",
                type: "select",
                required: false,
                optionsUrl: "/api/organization/positions/",
                optionLabelKey: "name",
                optionValueKey: "id"
            },
            { name: "is_manager", label: "Es Gerencial", type: "checkbox", required: false },
        ],
        columns: [
            { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div> },
            { accessorKey: "department.name", header: "Departamento", cell: ({ row }) => <div className="truncate">{row.original.department?.name}</div> },
            { accessorKey: "job_title.name", header: "Título", cell: ({ row }) => <div className="truncate">{row.original.job_title?.name}</div> },
        ],
        searchKey: "name",
    },
};

export default function OrganizationDynamicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
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
