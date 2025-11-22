'use client';

import { AdminHeader, type BreadcrumbItemType } from "@/components/AdminHeader";
import { PersonForm } from "@/components/PersonForm";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Panel de Control", href: "/admin/dashboard" },
    { name: "Gestión de Personal", href: "/admin/personnel" },
    { name: "Todas las Personas", href: "/admin/personnel/people" },
    { name: "Nuevo Registro", href: "/admin/personnel/people/create" },
];

export default function CreatePersonPage() {
    return (
        <>
            <AdminHeader items={breadcrumbItems} />

            {/* Contenedor principal con scroll y padding estandarizado */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="max-w-5xl mx-auto">
                    {/* Renderizamos el formulario en modo creación (sin ID inicial) */}
                    <PersonForm />
                </div>
            </div>
        </>
    );
}