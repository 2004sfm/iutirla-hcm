'use client';
import { useState } from 'react';
import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox";

// --- DEFINICIÓN DE TIPOS ---
interface CatalogConfig {
    name: string;
    endpoint: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

// --- LISTA MAESTRA DE CATÁLOGOS DE TALENTO ---
const talentCatalogs: CatalogConfig[] = [
    // --- 1. EDUCACIÓN ---
    {
        name: 'Niveles de Educación',
        endpoint: '/api/talent/education-levels/',
        formFields: [{ name: "name", label: "Nombre (ej. Licenciatura)", type: "text", required: true }]
    },
    {
        name: 'Campos de Estudio',
        endpoint: '/api/talent/fields-of-study/',
        formFields: [{ name: "name", label: "Nombre (ej. Ingeniería de Software)", type: "text", required: true }]
    },

    // --- 2. EXPERIENCIA Y FUNCIONES ---
    {
        name: 'Funciones de Negocio',
        endpoint: '/api/talent/business-functions/',
        formFields: [
            { name: "name", label: "Nombre (ej. Finanzas, IT)", type: "text", required: true },
            { name: "description", label: "Descripción", type: "text" }
        ]
    },

    // --- 3. IDIOMAS (Traídos de 'core' por lógica de negocio) ---
    {
        name: 'Idiomas',
        endpoint: '/api/core/languages/',
        formFields: [{ name: "name", label: "Nombre (ej. Inglés)", type: "text", required: true }]
    },
    {
        name: 'Niveles de Fluidez',
        endpoint: '/api/core/language-proficiencies/',
        formFields: [{ name: "name", label: "Nivel (ej. Nativo, Avanzado)", type: "text", required: true }]
    },
];

// Breadcrumbs
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Configuración", href: "/admin/config/general" },
    { name: "Catálogos de talento", href: "/admin/config/talent" },
];

export default function TalentConfigPage() {
    const [selectedCatalogEndpoint, setSelectedCatalogEndpoint] = useState<string | null>(null);
    const selectedCatalogConfig = talentCatalogs.find(c => c.endpoint === selectedCatalogEndpoint);

    // Preparamos las opciones para el Combobox
    const catalogOptions = talentCatalogs.map(c => ({
        value: c.endpoint,
        label: c.name
    }));

    return (
        <>
            <AdminHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-8 p-4 border rounded-lg bg-card shadow-sm">
                    <span className="text-sm font-medium">Gestionar:</span>

                    {/* Selector con Buscador (Combobox) */}
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