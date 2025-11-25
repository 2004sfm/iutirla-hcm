'use client';
import { useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef, FormFieldDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox";

// --- DEFINICIÓN DE TIPOS ---
interface CatalogConfig {
    name: string; // Nombre en plural (para el título de la tabla)
    singularName: string; // ¡Propiedad agregada para mensajes en singular!
    endpoint: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

// --- LISTA MAESTRA DE CATÁLOGOS DE TALENTO ---
const talentCatalogs: CatalogConfig[] = [
    // --- 1. Educación ---
    {
        name: 'Niveles de educación',
        singularName: 'Nivel de educación', // Agregado
        endpoint: '/api/talent/education-levels/',
        formFields: [{ name: "name", label: "Nombre (ej. licenciatura)", type: "text", required: true }]
    },
    {
        name: 'Campos de estudio',
        singularName: 'Campo de estudio', // Agregado
        endpoint: '/api/talent/fields-of-study/',
        formFields: [{ name: "name", label: "Nombre (ej. ingeniería de software)", type: "text", required: true }]
    },

    // --- 2. Experiencia y funciones ---
    {
        name: 'Funciones de negocio',
        singularName: 'Función de negocio', // Agregado
        endpoint: '/api/talent/business-functions/',
        formFields: [
            { name: "name", label: "Nombre (ej. finanzas, it)", type: "text", required: true },
            { name: "description", label: "Descripción", type: "text" }
        ]
    },

    // --- 3. Idiomas (traídos de 'core' por lógica de negocio) ---
    {
        name: 'Idiomas',
        singularName: 'Idioma', // Agregado
        endpoint: '/api/talent/languages/',
        formFields: [{ name: "name", label: "Nombre (ej. inglés)", type: "text", required: true }]
    },
    {
        name: 'Niveles de fluidez',
        singularName: 'Nivel de fluidez', // Agregado
        endpoint: '/api/talent/language-proficiencies/',
        formFields: [{ name: "name", label: "Nivel (ej. nativo, avanzado)", type: "text", required: true }]
    },
];

// Breadcrumbs
const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Configuración", href: "/admin/config" },
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
            <CatalogHeader items={breadcrumbItems} />

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