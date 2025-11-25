'use client';

import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";

// --- CONFIGURACIÓN DE CAMPOS Y COLUMNAS ---

const departmentColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "name" },
    // FIX: Cambiamos 'parent' (ID) por 'parent_name' (Texto)
    // Si es null (no tiene padre), la tabla simplemente mostrará vacío, lo cual es correcto.
    { header: "Departamento Superior", accessorKey: "parent_name" },
];

const departmentFields: FormFieldDef[] = [
    {
        name: "name",
        label: "Nombre",
        type: "text",
        required: true,
        helpText: "Ej: Recursos Humanos, Rectoría"
    },
    {
        name: "parent",
        label: "Departamento Superior (Padre)",
        type: "select",
        // Se carga a sí mismo para permitir jerarquía
        optionsEndpoint: "/api/organization/departments/",
        optionsLabelKey: "name",
        helpText: "Reporta a:"
    }
];

// --- BREADCRUMBS ---
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Organización", href: "/admin/organization" },
    { name: "Gestión de estructura", href: "/admin/organization/departments" },
];

// --- CONFIGURACIÓN PRINCIPAL (AÑADIENDO NOMBRES SINGULAR Y PLURAL) ---
const CATALOG_CONFIG = {
    name: "Departamentos",
    singularName: "Departamento",
    endpoint: "/api/organization/departments/",
    columns: departmentColumns,
    formFields: departmentFields,
};


export default function DepartmentsPage() {
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