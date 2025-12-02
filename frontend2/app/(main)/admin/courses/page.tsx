"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Plus, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Course, courseStatusDisplay, courseModalityDisplay } from "@/types/course";

export default function AdminCoursesPage() {
    const fields: CatalogField[] = [
        { name: "name", label: "Nombre del Curso", type: "text", required: true },
        { name: "description", label: "Descripción", type: "textarea", required: false },
        {
            name: "status",
            label: "Estado",
            type: "select",
            required: true,
            options: [
                { value: "BOR", label: "Borrador" },
                { value: "PRO", label: "Programado" },
                { value: "EJE", label: "En Ejecución" },
                { value: "FIN", label: "Finalizado" },
                { value: "CAN", label: "Cancelado" },
            ]
        },
        {
            name: "modality",
            label: "Modalidad",
            type: "select",
            required: true,
            options: [
                { value: "PRE", label: "Presencial" },
                { value: "VIR", label: "Virtual (En Vivo / Zoom)" },
                { value: "ASY", label: "Virtual (Autoaprendizaje)" },
                { value: "MIX", label: "Híbrido / Mixto" },
            ]
        },
        { name: "start_date", label: "Fecha de Inicio", type: "date", required: true },
        { name: "end_date", label: "Fecha de Fin", type: "date", required: true },
        { name: "duration_hours", label: "Duración (horas)", type: "number", required: true },
        { name: "max_participants", label: "Cupo Máximo", type: "number", required: true },
    ];

    const columns: ColumnDef<Course>[] = [
        {
            accessorKey: "name",
            header: "Nombre del Curso",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.name}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {courseStatusDisplay[row.original.status]}
                </Badge>
            ),
        },
        {
            accessorKey: "modality",
            header: "Modalidad",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {courseModalityDisplay[row.original.modality]}
                </span>
            ),
        },
        {
            accessorKey: "start_date",
            header: "Fecha Inicio",
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.start_date).toLocaleDateString('es-ES')}
                </span>
            ),
        },
        {
            accessorKey: "end_date",
            header: "Fecha Fin",
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.end_date).toLocaleDateString('es-ES')}
                </span>
            ),
        },
        {
            accessorKey: "enrolled_count",
            header: "Inscritos",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {row.original.enrolled_count} / {row.original.max_participants}
                    </span>
                    {row.original.is_full && (
                        <Badge variant="destructive" className="text-xs">
                            Lleno
                        </Badge>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <CatalogCRUD
                title="Gestión de Cursos"
                icon={BookOpen}
                apiUrl="/api/training/courses/"
                fields={fields}
                columns={columns}
                searchKey="name"
                disableCreate={true}
                disableEdit={true}
                customToolbarActions={
                    <Button asChild>
                        <Link href="/admin/courses/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Curso
                        </Link>
                    </Button>
                }
                extraActions={(item) => (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/courses/${item.id}`} className="cursor-pointer w-full flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
            />
        </div>
    );
}
