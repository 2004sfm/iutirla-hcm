"use client";

import { useState, useEffect, useMemo } from "react";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { ActionMenu } from "@/components/ui/action-menu";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface CatalogField {
    name: string;
    label: string;
    type: "text" | "number" | "email" | "select";
    required?: boolean;
    optionsUrl?: string; // API endpoint to fetch options
    optionLabelKey?: string; // Key to display (default: name)
    optionValueKey?: string; // Key for value (default: id)
}

interface CatalogCRUDProps {
    title: string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
}

export function CatalogCRUD({ title, apiUrl, fields, columns, searchKey }: CatalogCRUDProps) {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditConfirmDialogOpen, setIsEditConfirmDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [pendingFormData, setPendingFormData] = useState<any>(null);

    // Dynamic Zod Schema Generation
    const formSchema = useMemo(() => {
        const shape: Record<string, z.ZodTypeAny> = {};
        fields.forEach((field) => {
            let fieldSchema;
            if (field.type === "number") {
                fieldSchema = z.coerce.number();
            } else {
                fieldSchema = z.string();
            }

            if (field.required) {
                if (field.type === "number") {
                    fieldSchema = fieldSchema.min(1, { message: `${field.label} es requerido` });
                } else {
                    fieldSchema = fieldSchema.min(1, { message: `${field.label} es requerido` });
                }
            } else {
                fieldSchema = fieldSchema.optional();
            }
            shape[field.name] = fieldSchema;
        });
        return z.object(shape);
    }, [fields]);

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {},
    });

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(apiUrl);
            setData(response.data.results || response.data); // Handle pagination or list
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar los datos.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Options for Select Fields
    const fetchOptions = async () => {
        const options: Record<string, any[]> = {};
        for (const field of fields) {
            if (field.type === "select" && field.optionsUrl) {
                try {
                    const response = await apiClient.get(field.optionsUrl);
                    options[field.name] = response.data.results || response.data;
                } catch (error) {
                    console.error(`Error fetching options for ${field.name}:`, error);
                }
            }
        }
        setFieldOptions(options);
    };

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, [apiUrl]);

    // Open Create Dialog
    const handleCreate = () => {
        setCurrentItem(null);
        setServerError(null);
        form.reset({});
        // Reset default values based on fields
        const defaults: any = {};
        fields.forEach(f => defaults[f.name] = "");
        form.reset(defaults);
        setIsDialogOpen(true);
    };

    // Open Edit Dialog
    const handleEdit = (item: any) => {
        setCurrentItem(item);
        setServerError(null);
        // For selects, we might need to map objects to IDs if the API returns objects
        const formattedItem = { ...item };
        fields.forEach(field => {
            if (field.type === "select" && typeof item[field.name] === 'object' && item[field.name] !== null) {
                formattedItem[field.name] = item[field.name].id.toString();
            } else if (item[field.name] !== undefined && item[field.name] !== null) {
                formattedItem[field.name] = item[field.name].toString();
            }
        });
        form.reset(formattedItem);
        setIsDialogOpen(true);
    };

    // Open Delete Dialog
    const handleDeleteClick = (item: any) => {
        setCurrentItem(item);
        setIsDeleteDialogOpen(true);
    };

    // Submit Form (Create/Update)
    const onSubmit = async (values: FormValues) => {
        // If editing, show confirmation dialog first
        if (currentItem) {
            setPendingFormData(values);
            setIsEditConfirmDialogOpen(true);
            return;
        }

        // If creating, submit directly
        await submitForm(values);
    };

    // Actual submission function
    const submitForm = async (values: FormValues) => {
        setIsSaving(true);
        setServerError(null);
        setIsEditConfirmDialogOpen(false);
        try {
            if (currentItem) {
                // Update
                await apiClient.patch(`${apiUrl}${currentItem.id}/`, values);
                toast.success("Registro actualizado correctamente.");
            } else {
                // Create
                await apiClient.post(apiUrl, values);
                toast.success("Registro creado correctamente.");
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            console.error("Error saving data:", error);
            if (error.response) {
                const data = error.response.data;
                if (error.response.status === 400) {
                    // Field validation errors
                    if (data.non_field_errors) {
                        setServerError(data.non_field_errors[0]);
                    } else if (data.detail) {
                        setServerError(data.detail);
                    } else {
                        // Set field errors in react-hook-form
                        Object.keys(data).forEach((key) => {
                            // Check if key exists in fields
                            if (fields.some(f => f.name === key)) {
                                form.setError(key, {
                                    type: "manual",
                                    message: Array.isArray(data[key]) ? data[key][0] : data[key],
                                });
                            } else {
                                // If error is for a field not in the form, show as general error
                                setServerError(`${key}: ${Array.isArray(data[key]) ? data[key][0] : data[key]}`);
                            }
                        });
                    }
                } else {
                    setServerError(data.detail || "Ocurrió un error al guardar el registro.");
                }
            } else {
                setServerError("Error de conexión. Verifique su internet.");
            }
            toast.error("Error al guardar el registro.");
        } finally {
            setIsSaving(false);
        }
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!currentItem) return;
        try {
            await apiClient.delete(`${apiUrl}${currentItem.id}/`);
            toast.success("Registro eliminado correctamente.");
            setIsDeleteDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting data:", error);
            toast.error("Error al eliminar el registro.");
        }
    };

    // Add Actions Column
    const tableColumns: ColumnDef<any>[] = [
        ...columns,
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="text-right">
                        <ActionMenu
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDeleteClick(item)}
                        />
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo
                </Button>
            </div>

            {isLoading ? (
                <TableSkeleton columnCount={tableColumns.length} />
            ) : (
                <DataTable columns={tableColumns} data={data} searchKey={searchKey} />
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{currentItem ? "Editar Registro" : "Nuevo Registro"}</DialogTitle>
                        <DialogDescription>
                            Complete el formulario para {currentItem ? "actualizar" : "crear"} el registro.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-1 py-2">
                        {serverError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {serverError}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Form {...form}>
                            <form id="catalog-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {fields.map((field) => (
                                    <FormField
                                        key={field.name}
                                        control={form.control}
                                        name={field.name}
                                        render={({ field: formField }) => (
                                            <FormItem>
                                                <FormLabel>{field.label}</FormLabel>
                                                <FormControl>
                                                    {field.type === "select" ? (
                                                        <Combobox
                                                            options={fieldOptions[field.name]?.map((option) => ({
                                                                value: option[field.optionValueKey || "id"].toString(),
                                                                label: option[field.optionLabelKey || "name"],
                                                            })) || []}
                                                            value={formField.value?.toString() || ""}
                                                            onSelect={(value) => formField.onChange(value)}
                                                            placeholder="Seleccione una opción"
                                                            emptyText="No se encontraron resultados."
                                                        />
                                                    ) : (
                                                        <Input
                                                            type={field.type}
                                                            placeholder={field.label}
                                                            {...formField}
                                                            value={(formField.value as string | number) ?? ""}
                                                        />
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </form>
                        </Form>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="catalog-form" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Confirmation Dialog */}
            <AlertDialog open={isEditConfirmDialogOpen} onOpenChange={setIsEditConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de realizar los cambios?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se actualizará el registro con los nuevos datos ingresados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => pendingFormData && submitForm(pendingFormData)}
                            disabled={isSaving}
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
