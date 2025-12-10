"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { notFound } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface CatalogConfig {
    title: string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
    searchOptions?: { label: string; value: string }[];
    extraActions?: (item: any) => React.ReactNode;
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

const configs: Record<string, CatalogConfig> = {
    departments: {
        title: "Departamentos",
        singularName: "Departamento",
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
        ],
        columns: [
            { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div> },
            { accessorKey: "parent.name", header: "Padre", cell: ({ row }) => <div className="truncate">{row.original.parent?.name || "-"}</div> },
        ],
        searchKey: "name",
        searchOptions: [
            { label: "Nombre", value: "name" }
        ]
    },
    "job-titles": {
        title: "Títulos de Cargo",
        singularName: "Título de Cargo",
        apiUrl: "/api/organization/job-titles/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
        searchOptions: [
            { label: "Nombre", value: "name" }
        ]
    },
    positions: {
        title: "Posiciones",
        singularName: "Posición",
        apiUrl: "/api/organization/positions/",
        fields: [
            { name: "job_title", label: "Cargo", type: "select", required: true, optionsUrl: "/api/organization/job-titles/", optionLabelKey: "name", optionValueKey: "id" },
            { name: "department", label: "Departamento", type: "select", required: true, optionsUrl: "/api/organization/departments/", optionLabelKey: "name", optionValueKey: "id" },
            { name: "manager_positions", label: "Jefes Inmediatos", type: "select", required: false, optionsUrl: "/api/organization/positions/?is_manager=true", optionLabelKey: "full_name", optionValueKey: "id" },
            { name: "vacancies", label: "Vacantes", type: "number", required: true },
            { name: "is_manager", label: "Es Gerencial", type: "checkbox", required: false },
        ],
        columns: [
            { accessorKey: "job_title_name", header: "Cargo", cell: ({ row }) => <div className="truncate">{row.original.job_title_name}</div> },
            { accessorKey: "department_name", header: "Departamento", cell: ({ row }) => <div className="truncate">{row.getValue("department_name")}</div> },
            { accessorKey: "active_employees_count", header: "Ocupados", cell: ({ row }) => <div className="text-center">{row.getValue("active_employees_count")}</div> },
            { accessorKey: "vacancies", header: "Vacantes", cell: ({ row }) => <div className="text-center">{row.getValue("vacancies")}</div> },
        ],
        searchKey: "job_title__name",
        searchOptions: [
            { label: "Cargo", value: "job_title__name" },
            { label: "Departamento", value: "department__name" }
        ],
        extraActions: (item) => (
            <DropdownMenuItem asChild>
                <Link href={`/admin/organization/positions/${item.id}`} className="cursor-pointer w-full flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalle
                </Link>
            </DropdownMenuItem>
        )
    },
    "person-department-roles": {
        title: "Roles Jerárquicos",
        singularName: "Rol Jerárquico",
        apiUrl: "/api/employment/person-department-roles/",
        fields: [
            {
                name: "person",
                label: "Persona",
                type: "select",
                required: true,
                optionsUrl: "/api/core/persons/",
                optionLabelKey: "full_name",
                optionValueKey: "id"
            },
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
                name: "hierarchical_role",
                label: "Rol Jerárquico",
                type: "select",
                required: true,
                options: [
                    { label: "Gerente", value: "MGR" },
                    { label: "Empleado", value: "EMP" }
                ]
            },
            {
                name: "start_date",
                label: "Fecha de Inicio",
                type: "date",
                required: true
            },
            {
                name: "end_date",
                label: "Fecha de Fin",
                type: "date",
                required: false
            },
            {
                name: "notes",
                label: "Notas",
                type: "textarea",
                required: false
            }
        ],
        columns: [
            { accessorKey: "person_name", header: "Persona", cell: ({ row }) => <div className="truncate">{row.original.person_name}</div> },
            { accessorKey: "department_name", header: "Departamento", cell: ({ row }) => <div className="truncate">{row.original.department_name}</div> },
            { accessorKey: "hierarchical_role_display", header: "Rol", cell: ({ row }) => <div className="truncate">{row.original.hierarchical_role_display}</div> },
            { accessorKey: "start_date", header: "Inicio", cell: ({ row }) => <div className="truncate">{row.getValue("start_date")}</div> },
            { accessorKey: "is_current", header: "Vigente", cell: ({ row }) => <div className="truncate">{row.original.is_current ? "Sí" : "No"}</div> },
        ],
        searchKey: "person_name",
        searchOptions: [
            { label: "Persona", value: "person__first_name" }, // Assuming person has first_name, or use full_name if supported
            { label: "Departamento", value: "department__name" }
        ]
    },
};

export default function OrganizationDynamicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const config = configs[slug];

    if (!config) {
        notFound();
    }

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <CatalogCRUD
                title={config.title}
                apiUrl={config.apiUrl}
                fields={config.fields}
                columns={config.columns}
                searchKey={config.searchKey}
                searchOptions={config.searchOptions}
                extraActions={config.extraActions}
                singularName={config.singularName}
            />
        </div>
    );
}
