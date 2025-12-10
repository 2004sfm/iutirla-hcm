"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { Users, Eye, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Candidate {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    national_id: string;
    job_posting: number;
    job_posting_title: string;
    stage: string;
    stage_display: string;
    created_at: string;
    cv_file?: string;
}

const stageColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    REV: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    INT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    OFF: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    HIRED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    REJ: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    POOL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export default function CandidatesPage() {
    const router = useRouter();

    const fields: CatalogField[] = [
        {
            name: "first_name",
            label: "Nombres",
            type: "text",
            required: true,
        },
        {
            name: "last_name",
            label: "Apellidos",
            type: "text",
            required: true,
        },
        {
            name: "national_id",
            label: "Cédula",
            type: "text",
            required: true,
        },
        {
            name: "email",
            label: "Correo Electrónico",
            type: "email",
            required: true,
        },
        {
            name: "phone",
            label: "Teléfono",
            type: "text",
            required: true,
        },
        {
            name: "job_posting",
            label: "Vacante",
            type: "select",
            required: true,
            optionsUrl: "/api/ats/jobs/",
            optionLabelKey: "title",
            optionValueKey: "id",
        },
        {
            name: "stage",
            label: "Etapa",
            type: "select",
            options: [
                { label: "Nuevo", value: "NEW" },
                { label: "En Revisión", value: "REV" },
                { label: "Entrevista/Pruebas", value: "INT" },
                { label: "Oferta Enviada", value: "OFF" },
                { label: "Contratado", value: "HIRED" },
                { label: "Rechazado", value: "REJ" },
                { label: "Banco de Elegibles", value: "POOL" },
            ],
            defaultValue: "NEW",
        },
    ];

    const columns: ColumnDef<Candidate>[] = [
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.first_name} {row.original.last_name}
                </div>
            ),
        },
        {
            accessorKey: "national_id",
            header: "Cédula",
            cell: ({ row }) => <div>{row.getValue("national_id")}</div>,
        },
        {
            accessorKey: "job_posting_title",
            header: "Vacante",
            cell: ({ row }) => <div className="max-w-[200px] truncate" title={row.getValue("job_posting_title")}>{row.getValue("job_posting_title")}</div>,
        },
        {
            accessorKey: "stage_display",
            header: "Etapa",
            cell: ({ row }) => {
                const stage = row.original.stage;
                return (
                    <Badge className={stageColors[stage] || ""}>
                        {row.getValue("stage_display")}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "Fecha",
            cell: ({ row }) => (
                <div className="text-sm">
                    {new Date(row.getValue("created_at")).toLocaleDateString("es-ES")}
                </div>
            ),
        },
    ];

    return (
        <CatalogCRUD
            title="Gestión de Candidatos"
            icon={Users}
            apiUrl="/api/ats/candidates/"
            fields={fields}
            columns={columns}
            searchKey="search"
            singularName="Candidato"
            extraActions={(item) => (
                <>
                    <DropdownMenuItem onClick={() => router.push(`/admin/ats/candidates/${item.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Perfil
                    </DropdownMenuItem>
                    {item.cv_file && (
                        <DropdownMenuItem asChild>
                            <a
                                href={`http://localhost:8000${item.cv_file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar CV
                            </a>
                        </DropdownMenuItem>
                    )}
                </>
            )}
        />
    );
}
