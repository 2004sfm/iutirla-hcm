'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';

// UI
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Pencil, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

const functionSchema = z.object({
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

type FunctionFormData = z.infer<typeof functionSchema>;

interface FunctionsListProps {
    positionId: number;
}

interface FunctionItem {
    id: number;
    description: string;
    order: number;
    position: number;
}

export function FunctionsList({ positionId }: FunctionsListProps) {
    const [functions, setFunctions] = useState<FunctionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [functionToDelete, setFunctionToDelete] = useState<number | null>(null);

    const form = useForm<FunctionFormData>({
        resolver: zodResolver(functionSchema) as Resolver<FunctionFormData>,
        defaultValues: {
            description: "",
        }
    });

    const { setError, clearErrors, formState: { errors }, reset } = form;

    const fetchFunctions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/api/organization/positions/${positionId}/functions/`);
            const data = res.data.results || res.data;
            setFunctions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading functions:", error);
            toast.error("Error al cargar funciones");
        } finally {
            setLoading(false);
        }
    }, [positionId]);

    useEffect(() => {
        if (positionId) fetchFunctions();
    }, [positionId, fetchFunctions]);

    const handleCreate = () => {
        setEditingId(null);
        setServerError(null);
        clearErrors();
        reset({ description: "" });
        setIsModalOpen(true);
    };

    const handleEdit = (item: FunctionItem) => {
        setEditingId(item.id);
        setServerError(null);
        clearErrors();
        reset({ description: item.description });
        setIsModalOpen(true);
    };

    const handleServerError = (err: AxiosError<DjangoErrorResponse>) => {
        const responseData = err.response?.data;
        const status = err.response?.status;

        if (responseData && typeof responseData === 'object') {
            const globalErrors: string[] = [];
            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                if (key === 'description') {
                    setError('description', { type: 'server', message: errorText });
                } else if (key !== 'non_field_errors') {
                    globalErrors.push(`${key}: ${errorText}`);
                } else {
                    globalErrors.push(errorText);
                }
            });

            if (globalErrors.length > 0) {
                setServerError(globalErrors.join('\n'));
            }
        } else {
            setServerError(`Ocurrió un problema de conexión o del servidor (${status || 'Desconocido'}).`);
        }
    };

    const onSubmit = async (data: FunctionFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const maxOrder = functions.length > 0 ? Math.max(...functions.map(f => f.order)) : -1;
            const payload = {
                description: data.description,
                position: positionId,
                order: editingId ? functions.find(f => f.id === editingId)?.order || 0 : maxOrder + 1
            };

            if (editingId) {
                await apiClient.patch(`/api/organization/positions/${positionId}/functions/${editingId}/`, payload);
                toast.success("Función actualizada exitosamente");
            } else {
                await apiClient.post(`/api/organization/positions/${positionId}/functions/`, payload);
                toast.success("Función agregada exitosamente");
            }

            setIsModalOpen(false);
            fetchFunctions();

        } catch (err) {
            if (err instanceof AxiosError) {
                handleServerError(err as AxiosError<DjangoErrorResponse>);
            } else {
                setServerError("Ocurrió un error inesperado");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        setFunctionToDelete(id);
        setIsDeleteAlertOpen(true);
    };

    const deleteFunctionAction = useCallback(async () => {
        if (!functionToDelete) return;
        await apiClient.delete(`/api/organization/positions/${positionId}/functions/${functionToDelete}/`);
        fetchFunctions();
    }, [functionToDelete, positionId, fetchFunctions]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Funciones
                </h3>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : functions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                    No hay funciones registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            functions.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-sm">{item.description}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Función" : "Nueva Función"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap text-sm">
                                    {serverError}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
                                Descripción de la Función <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                {...form.register("description")}
                                placeholder="Ej: Planificar, Dirigir, Coordinar y Supervisar las actividades académicas y administrativas..."
                                rows={4}
                                className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.description && (
                                <span className="text-xs font-medium text-destructive block mt-1">
                                    {errors.description.message}
                                </span>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                {editingId ? "Guardar Cambios" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                open={isDeleteAlertOpen}
                setOpen={setIsDeleteAlertOpen}
                onConfirmDelete={deleteFunctionAction}
                successMessage="Función eliminada exitosamente."
                genericErrorMessage="No se pudo eliminar la función. Intente de nuevo."
            />
        </div>
    );
}
