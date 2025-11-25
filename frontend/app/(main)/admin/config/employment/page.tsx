'use client';
import { useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
// Asegúrate de importar desde AdminCatalogManager si ese es el nombre real del archivo
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox";

// --- TIPOS ---
interface CatalogConfig {
    name: string; // Nombre en plural (para el título de la tabla)
    singularName: string; // ¡Propiedad agregada para mensajes en singular!
    endpoint: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

// --- LISTA MAESTRA DE CATÁLOGOS DE EMPLEO ---
const employmentCatalogs: CatalogConfig[] = [
    // --- 1. Roles ---
    {
        name: 'Roles (jerarquía)',
        singularName: 'Rol (jerarquía)',
        endpoint: '/api/employment/roles/',
        columns: [
            { header: "Id", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "Descripción", accessorKey: "description" }
        ],
        formFields: [
            {
                name: "name",
                label: "Nombre (ej. Empleado, Gerente)",
                type: "text",
                required: true
            },
            {
                name: "description",
                label: "Descripción (opcional)",
                type: "text"
            }
        ]
    },

    // --- 2. Tipos de contrato ---
    {
        name: 'Tipos de contrato',
        singularName: 'Tipo de contrato',
        endpoint: '/api/employment/employment-types/',
        columns: [
            { header: "Id", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" }
        ],
        formFields: [
            {
                name: "name",
                label: "Nombre (ej. Indefinido, Pasante)",
                type: "text",
                required: true
            }
        ]
    },

    // --- 3. Estatus de empleo (CRÍTICO) ---
    {
        name: 'Estatus de empleo',
        singularName: 'Estatus de empleo',
        endpoint: '/api/employment/employment-statuses/',
        columns: [
            { header: "Id", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            // Mostramos si cuenta como ocupación de vacante
        ],
        formFields: [
            {
                name: "name",
                label: "Nombre (ej. Activo, Suspendido, Finalizado)",
                type: "text",
                required: true
            },
            // --- NUEVO CAMPO OBLIGATORIO PARA LA LÓGICA DE NEGOCIO ---
            {
                name: "is_active_relationship",
                label: "¿Es vinculación activa?",
                type: "boolean", // Asegúrate que tu CatalogManager renderice un Checkbox o Switch
                required: false, // False porque es un booleano (puede ser false)
            }
        ]
    },
];

// Breadcrumbs
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Configuración", href: "/admin/config" },
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
            <CatalogHeader items={breadcrumbItems} />

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
                        singularTitle={selectedCatalogConfig.singularName}
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