'use client';

import { useRouter } from 'next/navigation';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
// Asegúrate de importar desde el archivo correcto (AdminCatalogManager o CatalogManager)
import { CatalogManager, ColumnDef } from "@/components/CatalogManager";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

const peopleColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre y apellido", accessorKey: "full_name" },
    { header: "Cédula", accessorKey: "primary_document" },
    { header: "Contacto", accessorKey: "primary_email" },
    { header: "Teléfono", accessorKey: "primary_phone" },
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Panel de Control", href: "/admin/dashboard" },
    { name: "Gestión de Personal", href: "/admin/personnel" },
    { name: "Todas las Personas", href: "/admin/personnel/people" },
];

// --- CONFIGURACIÓN PRINCIPAL ---
const PEOPLE_CONFIG = {
    // Usamos 'Personas' para el singular/plural interno del CatalogManager
    name: "Personas",
    singularName: "Persona", // Agregado
    endpoint: "/api/core/persons/",
    columns: peopleColumns,
};

export default function PeoplePage() {
    const router = useRouter();

    return (
        <>
            <CatalogHeader
                items={breadcrumbItems}
            />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            Listado General
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Todas las personas registradas.
                        </p>
                    </div>

                    <Button onClick={() => router.push('/admin/personnel/people/create')}>
                        <Plus className="size-4" />
                        Registrar
                    </Button>
                </div>

                <CatalogManager
                    endpoint={PEOPLE_CONFIG.endpoint}
                    title={PEOPLE_CONFIG.singularName}
                    singularTitle={PEOPLE_CONFIG.singularName} // ¡Propiedad agregada!
                    columns={PEOPLE_CONFIG.columns}
                    editUrl="/admin/personnel/people"
                />
            </div>
        </>
    );
}