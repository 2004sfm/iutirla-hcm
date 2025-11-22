'use client';

import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";

// --- COLUMNAS ---
const jobTitleColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre del Título", accessorKey: "name" },
    { header: "Descripción", accessorKey: "description" },
];

// --- CAMPOS ---
const jobTitleFields: FormFieldDef[] = [
    {
        name: "name",
        label: "Nombre del Título",
        type: "text",
        required: true,
        helpText: "Ej: Director, Analista, Asistente Administrativo"
    },
    {
        name: "description",
        label: "Descripción",
        type: "text",
        helpText: "Breve descripción de las responsabilidades generales (Opcional)."
    }
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Organización", href: "/admin/organization" },
    { name: "Títulos de cargo", href: "/admin/organization/job-titles" },
];

export default function JobTitlesPage() {
    return (
        <>
            <AdminHeader
                items={breadcrumbItems}
            />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <CatalogManager
                    endpoint="/api/organization/jobtitles/"
                    title="Títulos de Cargo"
                    columns={jobTitleColumns}
                    formFields={jobTitleFields}
                />
            </div>
        </>
    );
}