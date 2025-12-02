"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";

export interface CatalogField {
    name: string;
    label: string;
    type: "text" | "number" | "email" | "select" | "checkbox" | "textarea" | "date" | "hidden";
    required?: boolean;
    optionsUrl?: string; // API endpoint to fetch options
    options?: { label: string; value: string }[]; // Static options
    optionLabelKey?: string; // Key to display (default: name)
    optionValueKey?: string; // Key for value (default: id)
    defaultValue?: any; // Default value for the field
    onChange?: (value: any, form: any, options?: any[]) => void; // Callback for value change
}

interface CatalogCRUDProps {
    title: React.ReactNode | string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
    searchOptions?: { label: string; value: string }[];
    extraActions?: (item: any) => React.ReactNode;
    disableCreate?: boolean;
    disableEdit?: boolean;
    customToolbarActions?: React.ReactNode;
    disablePagination?: boolean;
    icon?: React.ElementType;
}

export function CatalogCRUD({ title, apiUrl, fields, columns, searchKey, searchOptions, extraActions, disableCreate, disableEdit, customToolbarActions, disablePagination, icon: Icon }: CatalogCRUDProps) {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditConfirmDialogOpen, setIsEditConfirmDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({});
    const [serverError, setServerError] = useState<string | string[] | null>(null);
    const [pendingFormData, setPendingFormData] = useState<any>(null);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [rowCount, setRowCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    // Default to first option if available, otherwise empty
    const [currentSearchOption, setCurrentSearchOption] = useState(searchOptions?.[0]?.value || "");

    // Dynamic Zod Schema Generation
    const formSchema = useMemo(() => {
        const shape: Record<string, z.ZodTypeAny> = {};
        fields.forEach((field) => {
            let fieldSchema;
            if (field.type === "number") {
                fieldSchema = z.coerce.number();
                if (field.required) {
                    fieldSchema = fieldSchema.min(1, { message: `${field.label} es requerido` });
                }
            } else if (field.type === "checkbox") {
                // Handle boolean or empty string (which can happen if default is "")
                fieldSchema = z.union([z.boolean(), z.literal("")]).transform((val) => val === "" ? false : val).default(false);
            } else if (field.type === "hidden") {
                // Hidden fields can be anything, usually string or number
                fieldSchema = z.any();
            } else {
                fieldSchema = z.string();
                if (field.required) {
                    fieldSchema = fieldSchema.min(1, { message: `${field.label} es requerido` });
                }
            }

            if (!field.required && field.type !== "checkbox" && field.type !== "hidden") {
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
        // setIsLoading(true); // Removed to prevent unmounting DataTable on updates
        try {
            const params: any = {
                page: pagination.pageIndex + 1,
                page_size: pagination.pageSize,
            };
            if (searchTerm) {
                params.search = searchTerm;
                if (currentSearchOption) {
                    params.search_field = currentSearchOption;
                }
            }
            const response = await apiClient.get(apiUrl, { params });

            if (response.data.results) {
                setData(response.data.results);
                setRowCount(response.data.count);
            } else {
                // Fallback for non-paginated responses
                setData(response.data);
                setRowCount(response.data.length);
            }
        } catch (error) {
            // console.error("Error fetching data:", error);
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
                    const response = await apiClient.get(field.optionsUrl, { params: { page_size: 1000 } });
                    options[field.name] = response.data.results || response.data;
                } catch (error) {
                    // console.error(`Error fetching options for ${field.name}:`, error);
                }
            }
        }
        setFieldOptions(options);
    };

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, [apiUrl, pagination.pageIndex, pagination.pageSize, searchTerm, currentSearchOption]);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page on search
    }, []);

    // Open Create Dialog
    const handleCreate = () => {
        setCurrentItem(null);
        setServerError(null);
        form.reset({});
        // Reset default values based on fields
        const defaults: any = {};
        fields.forEach(f => {
            if (f.defaultValue !== undefined) {
                defaults[f.name] = f.defaultValue;
            } else if (f.type === "checkbox") {
                defaults[f.name] = false;
            } else {
                defaults[f.name] = "";
            }
        });
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
            const value = item[field.name];
            if (field.type === "select" && value !== null && typeof value === 'object') {
                if (Array.isArray(value)) {
                    // Si es un array (M2M), tomamos el primer elemento si existe
                    // Esto asume selección única para este campo en el frontend
                    if (value.length > 0) {
                        const firstItem = value[0];
                        if (typeof firstItem === 'object' && firstItem.id) {
                            formattedItem[field.name] = firstItem.id.toString();
                        } else if (firstItem && typeof firstItem !== 'object') {
                            formattedItem[field.name] = firstItem.toString();
                        }
                    } else {
                        formattedItem[field.name] = "";
                    }
                } else if (value.id) {
                    // Objeto único con ID
                    formattedItem[field.name] = value.id.toString();
                }
            } else if (field.type === "checkbox") {
                formattedItem[field.name] = value;
            } else if (value !== undefined && value !== null) {
                formattedItem[field.name] = value.toString();
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

        // Sanitize values: ensure checkboxes are booleans
        const sanitizedValues = { ...values };
        fields.forEach(f => {
            if (f.type === "checkbox") {
                sanitizedValues[f.name] = !!values[f.name];
            }
        });

        // If creating, submit directly
        await submitForm(sanitizedValues);
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
            // console.error("Error saving data:", error);
            if (error.response) {
                const data = error.response.data;
                const generalErrors: string[] = [];

                if (error.response.status === 400) {
                    // Field validation errors
                    if (data.non_field_errors) {
                        generalErrors.push(...data.non_field_errors);
                    }
                    if (data.detail) {
                        generalErrors.push(data.detail);
                    }

                    // Handle field errors
                    Object.keys(data).forEach((key) => {
                        if (key !== 'non_field_errors' && key !== 'detail') {
                            const msg = Array.isArray(data[key]) ? data[key][0] : data[key];

                            // Check if key exists in fields
                            if (fields.some(f => f.name === key)) {
                                const lowerMsg = String(msg).toLowerCase();
                                const isUniquenessError = lowerMsg.includes("existe") || lowerMsg.includes("registrado");

                                if (isUniquenessError) {
                                    // Uniqueness error: Global alert + Red border (empty message)
                                    form.setError(key, {
                                        type: "manual",
                                        message: "",
                                    });
                                    generalErrors.push(`${msg}`);
                                } else {
                                    // Standard validation error: Text below field
                                    form.setError(key, {
                                        type: "manual",
                                        message: msg,
                                    });
                                }
                            } else {
                                // If error is for a field not in the form, show as general error
                                // Also check if it's a non_field_error disguised as a field error (e.g. unique_together on hidden fields)
                                generalErrors.push(`${key}: ${msg}`);
                            }
                        }
                    });

                    // If we have field errors, we don't need to show a general error unless there are non_field_errors
                    // But if the user wants consistency, maybe we should always show field errors below the field.
                    // The issue is likely that some backend errors are not keyed to the field name.

                    if (generalErrors.length > 0) {
                        setServerError(generalErrors);
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
            // console.error("Error deleting data:", error);
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
                            onEdit={disableEdit ? undefined : () => handleEdit(item)}
                            onDelete={() => handleDeleteClick(item)}
                        >
                            {extraActions && extraActions(item)}
                        </ActionMenu>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {title ? (
                    <h2 className="text-xl font-bold tracking-tight flex items-center">
                        {Icon && <Icon className="mr-2 size-6 text-primary" />}
                        {title}
                    </h2>
                ) : <div></div>}
                <div className="flex gap-2">
                    {disableCreate ? customToolbarActions : (
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton columnCount={tableColumns.length} />
            ) : (
                <DataTable
                    columns={tableColumns}
                    data={data}
                    searchKey={searchKey}
                    searchOptions={searchOptions}
                    currentSearchOption={currentSearchOption}
                    onSearchOptionChange={setCurrentSearchOption}
                    rowCount={rowCount}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    onSearch={searchKey ? setSearchTerm : undefined}
                    disablePagination={disablePagination}
                />
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
                                    {Array.isArray(serverError) ? (
                                        serverError.length > 1 ? (
                                            <ul className="list-disc list-inside">
                                                {serverError.map((err, index) => (
                                                    <li key={index}>{err}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            serverError[0]
                                        )
                                    ) : (
                                        serverError
                                    )}
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
                                            <FormItem className={field.type === "hidden" ? "hidden" : ""}>
                                                {field.type !== "hidden" && <FormLabel>{field.label}</FormLabel>}
                                                <FormControl>
                                                    {field.type === "select" ? (
                                                        <Combobox
                                                            options={
                                                                field.options
                                                                    ? field.options
                                                                    : (fieldOptions[field.name]?.map((option) => ({
                                                                        value: option[field.optionValueKey || "id"].toString(),
                                                                        label: option[field.optionLabelKey || "name"],
                                                                    })) || [])
                                                            }
                                                            value={formField.value?.toString() || ""}
                                                            onSelect={(value) => {
                                                                formField.onChange(value);
                                                                if (field.onChange) {
                                                                    const options = field.options || fieldOptions[field.name];
                                                                    field.onChange(value, form, options);
                                                                }
                                                            }}
                                                            placeholder="Seleccione una opción"
                                                            emptyText="No se encontraron resultados."
                                                        />
                                                    ) : field.type === "checkbox" ? (
                                                        <div className="flex items-center space-x-2">
                                                            <Switch
                                                                checked={!!formField.value}
                                                                onCheckedChange={formField.onChange}
                                                            />
                                                            <Label>{field.label}</Label>
                                                        </div>
                                                    ) : field.type === "textarea" ? (
                                                        <Textarea
                                                            placeholder={field.label}
                                                            {...formField}
                                                            value={(formField.value as string) ?? ""}
                                                        />
                                                    ) : field.type === "date" ? (
                                                        <DatePicker
                                                            value={
                                                                formField.value && typeof formField.value === 'string'
                                                                    ? parseISO(formField.value)
                                                                    : (formField.value instanceof Date ? formField.value : undefined)
                                                            }
                                                            onChange={(date) => {
                                                                formField.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                                            }}
                                                            placeholder={field.label}
                                                        />
                                                    ) : field.type === "hidden" ? (
                                                        <input type="hidden" {...formField} value={(formField.value as string | number) ?? ""} />
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
