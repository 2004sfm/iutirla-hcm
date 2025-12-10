"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Briefcase, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface JobPosting {
    id: number;
    title: string;
    description: string;
    location: string | null;
    position: number | null;
    position_title: string | null;
    department_name: string | null;
    status: string;
    published_date: string | null;
    closing_date: string | null;
    candidates_count: number;
    created_at: string;
}

const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CLOSED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    FROZEN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const statusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    CLOSED: "Cerrada",
    FROZEN: "Congelada",
};

export default function JobsPage() {
    const router = useRouter();

    const fields: CatalogField[] = [
        {
            name: "title",
            label: "Título de la Vacante",
            type: "text",
            required: true,
        },
        {
            name: "position",
            label: "Posición Asociada",
            type: "select",
            required: true,
            optionsUrl: "/api/organization/positions/",
            optionLabelKey: "name",
            optionValueKey: "id",
        },
        {
            name: "description",
            label: "Descripción",
            type: "textarea",
            required: true,
        },
        {
            name: "location",
            label: "Ubicación",
            type: "text",
        },
        {
            name: "published_date",
            label: "Fecha de Publicación",
            type: "date",
        },
        {
            name: "closing_date",
            label: "Fecha de Cierre",
            type: "date",
        },
    ];

    const columns: ColumnDef<JobPosting>[] = [
        {
            accessorKey: "title",
            header: "Título",
            cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "position_title",
            header: "Posición",
            cell: ({ row }) => <div>{row.getValue("position_title") || "-"}</div>,
        },
        {
            accessorKey: "department_name",
            header: "Departamento",
            cell: ({ row }) => <div>{row.getValue("department_name") || "-"}</div>,
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <Badge className={statusColors[status] || ""}>
                        {statusLabels[status] || status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "candidates_count",
            header: "Candidatos",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.candidates_count}
                </div>
            ),
        },
    ];

    return (
        <CatalogCRUD
            title="Gestión de Vacantes"
            icon={Briefcase}
            apiUrl="/api/ats/jobs/"
            fields={fields}
            columns={columns}
            searchKey="title"
            singularName="Vacante"
            extraActions={(item) => (
                <>
                    <DropdownMenuItem onClick={() => router.push(`/admin/ats/jobs/${item.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/ats/candidates?job_posting=${item.id}`)}>
                        <Users className="mr-2 h-4 w-4" />
                        Ver Candidatos
                    </DropdownMenuItem>
                </>
            )}
        />
    );
}
