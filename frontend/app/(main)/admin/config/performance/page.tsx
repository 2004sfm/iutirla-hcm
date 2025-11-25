'use client';

import { useState } from 'react';
import { CatalogHeader } from "@/components/CatalogHeader";
import { CatalogManager, FormFieldDef, ColumnDef } from "@/components/CatalogManager";
import { SimpleCombobox } from "@/components/SimpleCombobox"; // Asumo que tienes este componente de tu ejemplo anterior

// Definición del Catálogo
interface CatalogConfig {
    name: string;
    singularName: string;
    endpoint: string;
    columns: ColumnDef[];
    formFields: FormFieldDef[];
}

const performanceCatalogs: CatalogConfig[] = [
    {
        name: 'Competencias / Criterios',
        singularName: 'Competencia',
        endpoint: '/api/performance/competencies/',
        columns: [
            { header: "ID", accessorKey: "id" },
            { header: "Nombre", accessorKey: "name" },
            { header: "Descripción", accessorKey: "description" },
            { header: "Global", accessorKey: "is_global" }, // Mostrará true/false
        ],
        formFields: [
            {
                name: "name",
                label: "Nombre de la Competencia",
                type: "text",
                required: true,
                helpText: "Ej: Trabajo en Equipo, Liderazgo, Puntualidad."
            },
            {
                name: "description",
                label: "Descripción",
                type: "text",
                helpText: "Explique qué se evalúa en este punto."
            },
            {
                name: "is_global",
                label: "¿Es Competencia Global?",
                type: "boolean", // Tu CatalogForm ya soporta esto con Switch
                helpText: "Si se marca, aplica a TODOS los empleados. Si no, debe asignarse a cargos específicos (en desarrollo)."
            }
        ]
    },
    // Aquí podrías agregar más catálogos si el módulo crece
];

const breadcrumbItems = [
    { name: "Configuración", href: "/admin/config" },
    { name: "Desempeño", href: "/admin/config/performance" },
];

export default function PerformanceConfigPage() {
    // Seleccionar por defecto el primero
    const [selectedCatalogEndpoint, setSelectedCatalogEndpoint] = useState<string | null>(performanceCatalogs[0].endpoint);
    const selectedCatalogConfig = performanceCatalogs.find(c => c.endpoint === selectedCatalogEndpoint);

    const catalogOptions = performanceCatalogs.map(c => ({
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
                        placeholder="Seleccionar catálogo"
                        className="w-full md:w-[400px]"
                    />
                </div>

                {selectedCatalogConfig && (
                    <CatalogManager
                        key={selectedCatalogConfig.endpoint}
                        endpoint={selectedCatalogConfig.endpoint}
                        title={selectedCatalogConfig.name}
                        singularTitle={selectedCatalogConfig.singularName}
                        columns={selectedCatalogConfig.columns}
                        formFields={selectedCatalogConfig.formFields}
                    />
                )}
            </div>
        </>
    );
}