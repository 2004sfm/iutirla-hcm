'use client';
import { useState } from 'react';
import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
// Asegúrate de importar desde AdminCatalogManager si ese es el nombre real del archivo
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox";

// --- TIPOS ---
interface CatalogConfig {
    name: string;
    endpoint: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

// --- LISTA MAESTRA DE CATÁLOGOS DE EMPLEO ---
const employmentCatalogs: CatalogConfig[] = [
    // --- 1. ROLES ---
    {
        name: 'Roles (Jerarquía)',
        endpoint: '/api/employment/roles/',
        columns: [
            { header: "ID", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "Descripción", accessorKey: "description" }
        ],
        formFields: [
            { name: "name", label: "Nombre (ej. Empleado, Supervisor)", type: "text", required: true },
            { name: "description", label: "Descripción (Opcional)", type: "text" }
        ]
    },

    // --- 2. TIPOS DE CONTRATO ---
    {
        name: 'Tipos de Contrato',
        endpoint: '/api/employment/employment-types/',
        formFields: [{ name: "name", label: "Nombre (ej. Tiempo Indefinido, Pasante)", type: "text", required: true }]
    },

    // --- 3. ESTATUS DE EMPLEO ---
    {
        name: 'Estatus de Empleo',
        endpoint: '/api/employment/employment-statuses/',
        formFields: [{ name: "name", label: "Nombre (ej. Activo, Suspendido, Reposo)", type: "text", required: true }]
    },
];

// Breadcrumbs
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Configuración", href: "/admin/config/general" },
    { name: "Catálogos empleo", href: "/admin/config/employment" },
];

export default function EmploymentConfigPage() {
    const [selectedCatalogEndpoint, setSelectedCatalogEndpoint] = useState<string | null>(null);
    const selectedCatalogConfig = employmentCatalogs.find(c => c.endpoint === selectedCatalogEndpoint);

    // Preparamos las opciones para el Combobox
    const catalogOptions = employmentCatalogs.map(c => ({
        value: c.endpoint,
        label: c.name
    }));

    return (
        <>
            <AdminHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-8 p-4 border rounded-lg bg-card shadow-sm">
                    <span className="text-sm font-medium">Gestionar:</span>

                    {/* Usamos el componente SimpleCombobox reutilizable */}
                    <SimpleCombobox
                        options={catalogOptions}
                        value={selectedCatalogEndpoint}
                        onChange={setSelectedCatalogEndpoint}
                        placeholder="Seleccionar"
                        searchPlaceholder="Buscar"
                        className="w-full md:w-[400px]"
                    />
                </div>

                {selectedCatalogConfig ? (
                    <CatalogManager
                        key={selectedCatalogConfig.endpoint}
                        endpoint={selectedCatalogConfig.endpoint}
                        title={selectedCatalogConfig.name}
                        columns={selectedCatalogConfig.columns}
                        formFields={selectedCatalogConfig.formFields}
                    />
                ) : (
                    <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed bg-muted/40">
                        <div className="text-center">
                            <p className="text-lg font-medium text-muted-foreground">No hay catálogo seleccionado</p>
                            <p className="text-sm text-muted-foreground mt-1">Seleccione una opción del menú superior para comenzar.</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}