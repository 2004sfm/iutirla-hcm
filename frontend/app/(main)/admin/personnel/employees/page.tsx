'use client';

import { useRouter } from 'next/navigation';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef } from "@/components/CatalogManager";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import { EmployeeHireModal } from "@/components/EmployeeHireModal";
import { useState } from 'react';

const employeeColumns: ColumnDef[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre Completo", accessorKey: "person_full_name" },
    { header: "Cargo", accessorKey: "position_full_name" },
    { header: "Departamento", accessorKey: "department_name" },
    { header: "Fecha Ingreso", accessorKey: "hire_date" },
    { header: "Estatus", accessorKey: "current_status" },
];

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Panel de Control", href: "/admin/dashboard" },
    { name: "Gestión de Personal", href: "/admin/personnel" },
    { name: "Empleados", href: "/admin/personnel/employees" },
];

const PEOPLE_CONFIG = {
    name: "Empleados",
    singularName: "Empleado",
    endpoint: "/api/employment/employments/",
    columns: employeeColumns,
};

export default function EmployeesPage() {
    const router = useRouter();
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);

    // 1. Estado para controlar la recarga de la tabla
    const [refreshKey, setRefreshKey] = useState(0);

    // 2. Función optimizada: Cambia la key en lugar de recargar la página
    const refreshTable = () => {
        setRefreshKey(prev => prev + 1); // Esto obliga a React a recargar solo el componente CatalogManager
        router.refresh(); // Opcional: Refresca datos del servidor Next.js si usas Server Components
    };

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Contratos Activos
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Listado de personal con una posición asignada y contrato activo.
                        </p>
                    </div>

                    <Button onClick={() => setIsHireModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Contratar Nuevo
                    </Button>
                </div>

                {/* 3. Añadimos la prop 'key'. Al cambiar el número, el componente se reinicia y vuelve a pedir datos */}
                <CatalogManager
                    key={refreshKey}
                    endpoint={PEOPLE_CONFIG.endpoint}
                    title={PEOPLE_CONFIG.singularName}
                    singularTitle={PEOPLE_CONFIG.singularName}
                    columns={PEOPLE_CONFIG.columns}
                    editUrl="/admin/personnel/employees"
                />
            </div>

            {/* Modal de Contratación */}
            <EmployeeHireModal
                isOpen={isHireModalOpen}
                setIsOpen={setIsHireModalOpen}
                onSuccess={refreshTable}
            />
        </>
    );
}