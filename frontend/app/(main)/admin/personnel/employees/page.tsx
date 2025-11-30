'use client';

import { useRouter } from 'next/navigation';
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";
import { CatalogManager, ColumnDef } from "@/components/CatalogManager";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";

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

                    <Button onClick={() => router.push('/admin/personnel/employees/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Contratar Nuevo
                    </Button>
                </div>

                <CatalogManager
                    endpoint={PEOPLE_CONFIG.endpoint}
                    title={PEOPLE_CONFIG.singularName}
                    singularTitle={PEOPLE_CONFIG.singularName}
                    columns={PEOPLE_CONFIG.columns}
                    editUrl="/admin/personnel/employees"
                />
            </div>
        </>
    );
}