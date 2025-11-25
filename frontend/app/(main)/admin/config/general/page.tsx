'use client';
import { useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox";

interface CatalogConfig {
    name: string; // Nombre en plural (para el título de la tabla)
    singularName: string; // ¡Nueva propiedad para los mensajes!
    endpoint: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

const generalCatalogs: CatalogConfig[] = [
    // --- 1. Geografía ---
    {
        name: 'Países',
        singularName: 'País', // Agregado
        endpoint: '/api/core/countries/',
        columns: [
            { header: "Id", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "Iso", accessorKey: "iso_2" },
            { header: "Prefijo", accessorKey: "phone_prefix" }
        ],
        formFields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "iso_2", label: "Código iso (2 letras)", type: "text", required: true },
            { name: "phone_prefix", label: "Prefijo telefónico (ej. +58)", type: "text", required: true }
        ]
    },
    {
        name: 'Estados',
        singularName: 'Estado', // Agregado
        endpoint: '/api/core/states/',
        columns: [
            { header: "Id", accessorKey: "id" },
            { header: "Estado", accessorKey: "name" },
            { header: "País", accessorKey: "country_name" }
        ],
        formFields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            {
                name: "country",
                label: "País",
                type: "select",
                required: true,
                optionsEndpoint: "/api/core/countries/",
                optionsLabelKey: "name"
            }
        ]
    },
    {
        name: 'Códigos de área telefónicos',
        singularName: 'Código de área telefónico', // Agregado
        endpoint: '/api/core/phone-area-codes/',
        columns: [
            { header: "Código", accessorKey: "code" },
            { header: "País", accessorKey: "country_name" },
            { header: "Operadora", accessorKey: "carrier_name" },
            { header: "Tipo", accessorKey: "type" }
        ],
        formFields: [
            { name: "code", label: "Código (ej. 414)", type: "text", required: true },
            { name: "type", label: "Tipo (móvil/fijo)", type: "text", required: true },
            {
                name: "country",
                label: "País",
                type: "select",
                required: true,
                optionsEndpoint: "/api/core/countries/",
                optionsLabelKey: "name"
            },
            {
                name: "carrier",
                label: "Operadora (opcional)",
                type: "select",
                optionsEndpoint: "/api/core/phone-carriers/",
                optionsLabelKey: "name"
            }
        ]
    },

    // --- 2. Finanzas ---
    {
        name: 'Bancos',
        singularName: 'Banco', // Agregado
        endpoint: '/api/core/banks/',
        columns: [
            { header: "Id", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "Código", accessorKey: "code" }
        ],
        formFields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "code", label: "Código bancario", type: "text", required: true },
        ]
    },
    {
        name: 'Tipos de cuenta bancaria',
        singularName: 'Tipo de cuenta bancaria', // Agregado
        endpoint: '/api/core/bank-account-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },

    // --- 3. Demografía ---
    {
        name: 'Géneros',
        singularName: 'Género', // Agregado
        endpoint: '/api/core/genders/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Estado civil',
        singularName: 'Estado civil', // Agregado
        endpoint: '/api/core/marital-statuses/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Saludos (títulos)',
        singularName: 'Saludo (título)', // Agregado
        endpoint: '/api/core/salutations/',
        formFields: [{ name: "name", label: "Nombre (sr., dr.)", type: "text", required: true }]
    },

    // --- 4. Contacto y relaciones ---
    {
        name: 'Tipos de dirección',
        singularName: 'Tipo de dirección', // Agregado
        endpoint: '/api/core/address-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de teléfono',
        singularName: 'Tipo de teléfono', // Agregado
        endpoint: '/api/core/phone-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Operadoras telefónicas',
        singularName: 'Operadora telefónica', // Agregado
        endpoint: '/api/core/phone-carriers/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de email',
        singularName: 'Tipo de email', // Agregado
        endpoint: '/api/core/email-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de relación (parentesco)',
        singularName: 'Tipo de relación (parentesco)', // Agregado
        endpoint: '/api/core/relationship-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },

    // --- 5. Identificación (modificado) ---
    // Ya no existe "tipos de id nacional". El sistema usa los tipos fijos (v, e, p).

    // --- 6. Discapacidad ---
    {
        name: 'Grupos de discapacidad',
        singularName: 'Grupo de discapacidad', // Agregado
        endpoint: '/api/core/disability-groups/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de discapacidad',
        singularName: 'Tipo de discapacidad', // Agregado
        endpoint: '/api/core/disability-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Estatus de discapacidad',
        singularName: 'Estatus de discapacidad', // Agregado
        endpoint: '/api/core/disability-statuses/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
];

// Breadcrumbs
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Configuración", href: "/admin/config" },
    { name: "Catálogos Generales", href: "/admin/config/general" },
];

export default function GeneralConfigPage() {
    const [selectedCatalogEndpoint, setSelectedCatalogEndpoint] = useState<string | null>(null);
    const selectedCatalogConfig = generalCatalogs.find(c => c.endpoint === selectedCatalogEndpoint);

    // Preparamos las opciones para el Combobox (mapeo simple)
    const catalogOptions = generalCatalogs.map(c => ({
        value: c.endpoint,
        label: c.name
    }));

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-8 p-4 border rounded-lg bg-card shadow-sm">
                    <span className="text-sm font-medium">Gestionar:</span>

                    <SimpleCombobox
                        options={catalogOptions}
                        value={selectedCatalogEndpoint}
                        onChange={setSelectedCatalogEndpoint}
                        placeholder="Seleccione una opción..."
                        searchPlaceholder="Buscar catálogo..."
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