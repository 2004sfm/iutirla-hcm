'use client';

import { useState } from 'react';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef } from "@/components/CatalogManager";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap } from "lucide-react";
import { CourseCreateModal } from "@/components/CourseCreateModal";

// Definición de columnas
const courseColumns: ColumnDef[] = [
    { header: "Nombre", accessorKey: "name" },
    { header: "Inicio", accessorKey: "start_date" },
    { header: "Fin", accessorKey: "end_date" },
    { header: "Modalidad", accessorKey: "modality_display" }, // Campo calculado en serializer
    { header: "Estado", accessorKey: "status_name" },         // Campo calculado en serializer
    { header: "Inscritos", accessorKey: "enrolled_count" },   // Campo calculado
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Panel de Control", href: "/admin/dashboard" },
    { name: "Capacitación", href: "/admin/training/courses" },
    { name: "Catálogo de Cursos", href: "/admin/training/courses" },
];

const CONFIG = {
    endpoint: "/api/training/courses/",
    singularName: "Curso",
    columns: courseColumns,
};

export default function CoursesPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1); // Recargar tabla
    };

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* ENCABEZADO CON BOTÓN DE ACCIÓN */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Oferta Académica
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Gestión de cursos, talleres y programas de formación.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Curso
                    </Button>
                </div>

                {/* TABLA DE CURSOS */}
                {/* Nota: editUrl apunta a la página de detalle que haremos luego */}
                <CatalogManager
                    key={refreshKey}
                    endpoint={CONFIG.endpoint}
                    title="Listado de Cursos"
                    singularTitle={CONFIG.singularName}
                    columns={CONFIG.columns}
                    editUrl="/admin/training/courses"
                />
            </div>

            {/* MODAL DE CREACIÓN */}
            <CourseCreateModal
                isOpen={isCreateModalOpen}
                setIsOpen={setIsCreateModalOpen}
                onSuccess={handleSuccess}
            />
        </>
    );
}