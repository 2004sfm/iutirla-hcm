'use client';
import { useState } from 'react';
import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox";

interface CatalogConfig {
    name: string;
    endpoint: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

// --- LISTA MAESTRA DE CATÁLOGOS GENERALES ---
const generalCatalogs: CatalogConfig[] = [
    // --- 1. GEOGRAFÍA ---
    {
        name: 'Países',
        endpoint: '/api/core/countries/',
        columns: [
            { header: "ID", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "ISO", accessorKey: "iso_2" },
            { header: "Prefijo", accessorKey: "phone_prefix" }
        ],
        formFields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "iso_2", label: "Código ISO (2 letras)", type: "text", required: true },
            { name: "phone_prefix", label: "Prefijo Telefónico (ej. +58)", type: "text", required: true }
        ]
    },
    {
        name: 'Estados',
        endpoint: '/api/core/states/',
        columns: [
            { header: "ID", accessorKey: "id" },
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
        name: 'Códigos de Área Telefónicos',
        endpoint: '/api/core/phone-area-codes/',
        columns: [
            { header: "Código", accessorKey: "code" },
            { header: "País", accessorKey: "country_name" },
            { header: "Operadora", accessorKey: "carrier_name" },
            { header: "Tipo", accessorKey: "type" }
        ],
        formFields: [
            { name: "code", label: "Código (ej. 414)", type: "text", required: true },
            { name: "type", label: "Tipo (Móvil/Fijo)", type: "text", required: true },
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
                label: "Operadora (Opcional)",
                type: "select",
                optionsEndpoint: "/api/core/phone-carriers/",
                optionsLabelKey: "name"
            }
        ]
    },

    // --- 2. FINANZAS ---
    {
        name: 'Bancos', endpoint: '/api/core/banks/',
        columns: [
            { header: "ID", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "Código", accessorKey: "code" }
        ],
        formFields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "code", label: "Código Bancario", type: "text", required: true },
        ]
    },
    {
        name: 'Tipos de Cuenta Bancaria', endpoint: '/api/core/bank-account-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },

    // --- 3. DEMOGRAFÍA ---
    {
        name: 'Géneros', endpoint: '/api/core/genders/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Estado Civil', endpoint: '/api/core/marital-statuses/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Saludos (Títulos)', endpoint: '/api/core/salutations/',
        formFields: [{ name: "name", label: "Nombre (Sr., Dr.)", type: "text", required: true }]
    },

    // --- 4. CONTACTO Y RELACIONES ---
    {
        name: 'Tipos de Dirección', endpoint: '/api/core/address-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de Teléfono', endpoint: '/api/core/phone-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Operadoras Telefónicas', endpoint: '/api/core/phone-carriers/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de Email', endpoint: '/api/core/email-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de Relación (Parentesco)', endpoint: '/api/core/relationship-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },

    // --- 5. IDENTIFICACIÓN (MODIFICADO) ---
    // Ya no existe "Tipos de ID Nacional". El sistema usa los tipos fijos (V, E, P).

    // --- 6. DISCAPACIDAD ---
    {
        name: 'Grupos de Discapacidad', endpoint: '/api/core/disability-groups/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Tipos de Discapacidad', endpoint: '/api/core/disability-types/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
    {
        name: 'Estatus de Discapacidad', endpoint: '/api/core/disability-statuses/',
        formFields: [{ name: "name", label: "Nombre", type: "text", required: true }]
    },
];

// Breadcrumbs
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Panel de Control", href: "/admin/dashboard" },
    { name: "Configuración", href: "/admin/config/general" },
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
            <AdminHeader items={breadcrumbItems} />

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