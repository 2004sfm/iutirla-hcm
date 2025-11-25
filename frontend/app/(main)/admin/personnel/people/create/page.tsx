'use client';

import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { PersonForm } from "@/components/PersonForm";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Gestión de Personal", href: "/admin/personnel" },
    { name: "Todas las Personas", href: "/admin/personnel/people" },
    { name: "Registrar", href: "/admin/personnel/people/create" },
];

export default function CreatePersonPage() {
    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            {/* Contenedor principal con scroll y padding estandarizado */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* <div className="max-w-5xl mx-auto"> */}
                {/* Renderizamos el formulario en modo creación (sin ID inicial) */}
                <PersonForm />
                {/* </div> */}
            </div>
        </>
    );
}