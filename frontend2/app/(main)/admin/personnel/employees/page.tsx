"use client";

import { useState, useEffect } from "react";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Users, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EmployeesPage() {
    const [hasPendingAccounts, setHasPendingAccounts] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Check for pending accounts on mount
    useEffect(() => {
        checkPendingAccounts();
    }, [refreshKey]);

    const checkPendingAccounts = async () => {
        try {
            const response = await apiClient.get("/api/accounts/users/check_pending_accounts/");
            setHasPendingAccounts(response.data.has_pending);
            setPendingCount(response.data.count);
        } catch (error) {
            console.error("Error checking pending accounts:", error);
        }
    };

    const handleBulkCreate = async () => {
        setIsCreating(true);
        try {
            const response = await apiClient.post("/api/accounts/users/bulk_create_employee_accounts/");

            const { created_count, error_count, errors } = response.data;

            if (created_count > 0) {
                toast.success(`${created_count} cuenta(s) creada(s) exitosamente`);
            }

            if (error_count > 0) {
                toast.warning(`${error_count} error(es) al crear cuentas`, {
                    description: errors.slice(0, 3).map((e: any) =>
                        `${e.person_name}: ${e.error}`
                    ).join("\n")
                });
            }

            // Refresh the check
            setRefreshKey(prev => prev + 1);
            setShowConfirmDialog(false);
        } catch (error: any) {
            console.error("Error creating accounts:", error);
            toast.error("Error al crear cuentas", {
                description: error.response?.data?.detail || "Ocurrió un error inesperado"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const fields: CatalogField[] = [
        {
            name: "person",
            label: "Persona",
            type: "select",
            required: true,
            optionsUrl: "/api/core/persons/",
            optionLabelKey: "full_name",
            optionValueKey: "id"
        },
        {
            name: "position",
            label: "Posición",
            type: "select",
            required: true,
            optionsUrl: "/api/organization/positions/",
            optionLabelKey: "job_title_name", // Assuming this field exists in Position serializer or adjust
            optionValueKey: "id"
        },
        {
            name: "role",
            label: "Rol",
            type: "select",
            required: true,
            options: [
                { label: "Empleado", value: "EMP" },
                { label: "Contratista", value: "CTR" },
                { label: "Pasante", value: "INT" }
            ]
        },
        {
            name: "employment_type",
            label: "Tipo de Empleo",
            type: "select",
            required: true,
            options: [
                { label: "Permanente", value: "PER" },
                { label: "Temporal", value: "TMP" },
                { label: "Medio Tiempo", value: "PRT" }
            ]
        },
        {
            name: "current_status",
            label: "Estatus",
            type: "select",
            required: true,
            options: [
                { label: "Activo", value: "ACT" },
                { label: "Permiso", value: "LEA" },
                { label: "Suspendido", value: "SUS" },
                { label: "Terminado", value: "TER" }
            ]
        },
        { name: "hire_date", label: "Fecha de Contratación", type: "date", required: true },
        { name: "end_date", label: "Fecha de Finalización", type: "date", required: false },
    ];

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "person_full_name",
            header: "Empleado",
            cell: ({ row }) => <div className="font-medium">{row.getValue("person_full_name")}</div>
        },
        {
            accessorKey: "person_document",
            header: "Cédula",
            cell: ({ row }) => <div className="truncate">{row.getValue("person_document")}</div>
        },
        {
            accessorKey: "position_full_name",
            header: "Cargo",
            cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("position_full_name")}</div>
        },
        {
            accessorKey: "department_name",
            header: "Departamento",
            cell: ({ row }) => <div className="truncate max-w-[150px]">{row.getValue("department_name")}</div>
        },
        {
            accessorKey: "current_status_display",
            header: "Estatus",
            cell: ({ row }) => {
                const status = row.original.current_status;
                const label = row.getValue("current_status_display") as string;

                let variant = "secondary";
                if (status === "ACT") variant = "default"; // Reverted to default (primary) as requested
                if (status === "TER") variant = "destructive";
                if (status === "LEA" || status === "SUS") variant = "outline";

                return <Badge variant={variant as any}>{label}</Badge>;
            }
        },
        {
            accessorKey: "hire_date",
            header: "Fecha Ingreso",
            cell: ({ row }) => <div className="truncate">{row.getValue("hire_date")}</div>
        },
    ];

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <CatalogCRUD
                title="Empleados"
                icon={Users}
                apiUrl="/api/employment/employments/"
                fields={fields}
                columns={columns}
                searchKey="person_name" // Backend filter might need adjustment if it doesn't support this directly
                searchOptions={[
                    { label: "Nombre", value: "person__first_name" }, // Adjust based on backend filter
                    { label: "Cargo", value: "position__job_title__name" }
                ]}
                disableCreate={true}
                disableEdit={true}
                customToolbarActions={
                    <div className="flex flex-col sm:flex-row w-full gap-2">
                        {hasPendingAccounts && (
                            <Button
                                variant="secondary"
                                onClick={() => setShowConfirmDialog(true)}
                                disabled={isCreating}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Crear Cuentas ({pendingCount})
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href="/admin/personnel/employees/new">
                                <Plus className="h-4 w-4" />
                                Nuevo Empleado
                            </Link>
                        </Button>
                    </div>
                }
                extraActions={(item) => (
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/personnel/employees/${item.id}`} className="cursor-pointer w-full flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                        </Link>
                    </DropdownMenuItem>
                )}
            />

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Crear Cuentas de Empleados</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>Se crearán cuentas de usuario para <strong>{pendingCount}</strong> empleado(s) activo(s) que actualmente no tienen cuenta.</p>
                                <p className="text-sm"><strong>Usuario:</strong> Se generará automáticamente basado en el nombre y cédula</p>
                                <p className="text-sm"><strong>Contraseña inicial:</strong> Número de cédula (los empleados podrán cambiarla después)</p>
                                <p className="text-sm text-muted-foreground mt-2">Esta acción no se puede deshacer, pero las cuentas pueden ser desactivadas posteriormente.</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCreating}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkCreate} disabled={isCreating}>
                            {isCreating ? "Creando..." : "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
