"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, XCircle } from "lucide-react";

interface Competency {
    id: number;
    name: string;
    description: string;
    category: string;
    is_global: boolean;
}

const CATEGORY_OPTIONS = [
    { value: "CAL", label: "Calidad" },
    { value: "COM", label: "Compromiso" },
    { value: "CMU", label: "Comunicación" },
    { value: "ORG", label: "Organización" },
    { value: "DIS", label: "Disciplina" },
    { value: "PRO", label: "Proactividad" },
];

const CATEGORY_COLORS: Record<string, string> = {
    CAL: "bg-blue-100 text-blue-800",
    COM: "bg-red-100 text-red-800",
    CMU: "bg-green-100 text-green-800",
    ORG: "bg-purple-100 text-purple-800",
    DIS: "bg-orange-100 text-orange-800",
    PRO: "bg-teal-100 text-teal-800",
};

const competenciesFields: CatalogField[] = [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "category", label: "Categoría", type: "select", required: true, options: CATEGORY_OPTIONS },
    { name: "description", label: "Descripción", type: "textarea", required: false },
    { name: "is_global", label: "Competencia Global (aplica a todos)", type: "checkbox", defaultValue: true },
];

const competenciesColumns: ColumnDef<Competency>[] = [
    {
        accessorKey: "name",
        header: "Competencia",
        cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ row }) => {
            const category = row.getValue("category") as string;
            const label = CATEGORY_OPTIONS.find(c => c.value === category)?.label || category;
            return (
                <Badge className={CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800"}>
                    {label}
                </Badge>
            );
        },
    },
    {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground line-clamp-2">
                {row.getValue("description")}
            </span>
        ),
    },
    {
        accessorKey: "is_global",
        header: "Tipo",
        cell: ({ row }) => {
            const isGlobal = row.getValue("is_global");
            return (
                <Badge variant={isGlobal ? "default" : "secondary"}>
                    {isGlobal ? (
                        <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Global
                        </>
                    ) : (
                        <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Específica
                        </>
                    )}
                </Badge>
            );
        },
    },
];

export default function CompetenciesPage() {
    return (
        <CatalogCRUD
            title="Gestión de Competencias"
            apiUrl="/api/performance/competencies/"
            fields={competenciesFields}
            columns={competenciesColumns}
            searchKey="name"
            searchOptions={[
                { label: "Nombre", value: "name" },
                { label: "Descripción", value: "description" },
                { label: "Categoría", value: "category" },
            ]}
            singularName="Competencia"
            icon={ClipboardList}
        />
    );
}
