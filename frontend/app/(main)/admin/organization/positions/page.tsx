'use client';

import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";

// --- COLUMNAS DE LA TABLA ---
const positionColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Título", accessorKey: "job_title_name" },
    { header: "Departamento", accessorKey: "department_name" },
    { header: "Jefe Inmediato", accessorKey: "manager_position_name" },
];

// --- CAMPOS DEL FORMULARIO (SIMPLIFICADO) ---
const positionFields: FormFieldDef[] = [
    {
        name: "job_title",
        label: "Título del Cargo",
        type: "select",
        required: true,
        optionsEndpoint: "/api/organization/jobtitles/",
        optionsLabelKey: "name",
        helpText: "Seleccione el nombre genérico del cargo (ej: Analista)."
    },
    {
        name: "department",
        label: "Departamento",
        type: "select",
        required: true,
        optionsEndpoint: "/api/organization/departments/",
        optionsLabelKey: "name",
        helpText: "¿A qué área pertenece esta posición?"
    },
    {
        name: "manager_position",
        label: "Jefe Inmediato (Reporta a)",
        type: "select",
        optionsEndpoint: "/api/organization/positions/",
        optionsLabelKey: "full_name",
        helpText: "Opcional. Seleccione la posición a la que debe reportar."
    }
    // ELIMINADO: Campo 'name' manual. 
    // Ahora el sistema confiará en la combinación Título + Departamento.
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Organización", href: "/admin/organization" },
    { name: "Cargos y posiciones", href: "/admin/organization/positions" },
];

export default function PositionsPage() {
    return (
        <>
            <AdminHeader
                items={breadcrumbItems}
            />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <CatalogManager
                    endpoint="/api/organization/positions/"
                    title="Posiciones"
                    columns={positionColumns}
                    formFields={positionFields}
                />
            </div>
        </>
    );
}