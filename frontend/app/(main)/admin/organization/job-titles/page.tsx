'use client';

import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";

// --- COLUMNAS ---
// --- COLUMNAS ---
const jobTitleColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre del Título", accessorKey: "name" },
];

// --- CAMPOS ---
const jobTitleFields: FormFieldDef[] = [
    {
        name: "name",
        label: "Nombre del Título",
        type: "text",
        required: true,
        helpText: "Ej: Director, Analista, Asistente Administrativo"
    }
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Organización", href: "/admin/organization" },
    { name: "Títulos de cargo", href: "/admin/organization/job-titles" },
];

// --- CONFIGURACIÓN PRINCIPAL (AÑADIENDO NOMBRES SINGULAR Y PLURAL) ---
const CATALOG_CONFIG = {
    name: "Títulos de Cargo",
    singularName: "Título de Cargo", // Agregado
    endpoint: "/api/organization/job-titles/",
    columns: jobTitleColumns,
    formFields: jobTitleFields,
};

export default function JobTitlesPage() {
    return (
        <>
            <CatalogHeader
                items={breadcrumbItems}
            />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <CatalogManager
                    endpoint={CATALOG_CONFIG.endpoint}
                    title={CATALOG_CONFIG.name}
                    singularTitle={CATALOG_CONFIG.singularName} // ¡Propiedad agregada!
                    columns={CATALOG_CONFIG.columns}
                    formFields={CATALOG_CONFIG.formFields}
                />
            </div>
        </>
    );
}