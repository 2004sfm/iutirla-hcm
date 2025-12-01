"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
    const fields: CatalogField[] = [
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
            name: "position",
            label: "Posición",
            type: "select",
            required: true,
            optionsUrl: "/api/organization/positions/",
            optionLabelKey: "job_title_name", // Assuming this field exists in Position serializer or adjust
            optionValueKey: "id"
        },
        {
            name: "role",
            label: "Rol",
            type: "select",
            required: true,
            options: [
                { label: "Empleado", value: "EMP" },
                { label: "Contratista", value: "CTR" },
                { label: "Pasante", value: "INT" }
            ]
        },
        {
            name: "employment_type",
            label: "Tipo de Empleo",
            type: "select",
            required: true,
            options: [
                { label: "Permanente", value: "PER" },
                { label: "Temporal", value: "TMP" },
                { label: "Medio Tiempo", value: "PRT" }
            ]
        },
        {
            name: "current_status",
            label: "Estatus",
            type: "select",
            required: true,
            options: [
                { label: "Activo", value: "ACT" },
                { label: "Permiso", value: "LEA" },
                { label: "Suspendido", value: "SUS" },
                { label: "Terminado", value: "TER" }
            ]
        },
        { name: "hire_date", label: "Fecha de Contratación", type: "date", required: true },
        { name: "end_date", label: "Fecha de Finalización", type: "date", required: false },
    ];

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "person_full_name",
            header: "Empleado",
            cell: ({ row }) => <div className="font-medium">{row.getValue("person_full_name")}</div>
        },
        {
            accessorKey: "person_document",
            header: "Cédula",
            cell: ({ row }) => <div className="truncate">{row.getValue("person_document")}</div>
        },
        {
            accessorKey: "position_full_name",
            header: "Cargo",
            cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("position_full_name")}</div>
        },
        {
            accessorKey: "department_name",
            header: "Departamento",
            cell: ({ row }) => <div className="truncate max-w-[150px]">{row.getValue("department_name")}</div>
        },
        {
            accessorKey: "current_status_display",
            header: "Estatus",
            cell: ({ row }) => {
                const status = row.original.current_status;
                const label = row.getValue("current_status_display") as string;

                let variant = "secondary";
                if (status === "ACT") variant = "default"; // Primary color for Active
                if (status === "TER") variant = "destructive";
                if (status === "LEA" || status === "SUS") variant = "outline";

                return <Badge variant={variant as any}>{label}</Badge>;
            }
        },
        {
            accessorKey: "hire_date",
            header: "Fecha Ingreso",
            cell: ({ row }) => <div className="truncate">{row.getValue("hire_date")}</div>
        },
    ];

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <CatalogCRUD
                title="Empleados"
                apiUrl="/api/employment/employments/"
                fields={fields}
                columns={columns}
                searchKey="person_name" // Backend filter might need adjustment if it doesn't support this directly
                searchOptions={[
                    { label: "Nombre", value: "person__first_name" }, // Adjust based on backend filter
                    { label: "Cargo", value: "position__job_title__name" }
                ]}
                extraActions={(item) => (
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/personnel/employees/${item.id}`} className="cursor-pointer w-full flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                        </Link>
                    </DropdownMenuItem>
                )}
            />
        </div>
    );
}
