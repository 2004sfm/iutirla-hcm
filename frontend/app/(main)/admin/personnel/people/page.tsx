'use client';

import { useRouter } from 'next/navigation';
import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
import { CatalogManager, ColumnDef } from "@/components/CatalogManager";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

const peopleColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre Completo", accessorKey: "full_name" },
    { header: "Documento", accessorKey: "primary_document" },
    { header: "Contacto", accessorKey: "primary_email" },
    { header: "Teléfono", accessorKey: "primary_phone" },
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Panel de Control", href: "/admin/dashboard" },
    { name: "Gestión de Personal", href: "/admin/personnel" },
    { name: "Todas las Personas", href: "/admin/personnel/people" },
];

export default function PeoplePage() {
    const router = useRouter();

    return (
        <>
            <AdminHeader
                items={breadcrumbItems}
            />

            {/* FIX: Contenedor ajustado */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Listado General
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Base de datos de todas las personas registradas.
                        </p>
                    </div>

                    <Button onClick={() => router.push('/admin/personnel/people/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Persona
                    </Button>
                </div>

                <CatalogManager
                    endpoint="/api/core/persons/"
                    title=""
                    columns={peopleColumns}
                />
            </div>
        </>
    );
}