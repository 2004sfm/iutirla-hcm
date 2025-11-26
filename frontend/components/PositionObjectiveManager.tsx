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
import { Loader2, Plus, Trash2, Pencil, AlertCircle, Target } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

const objectiveSchema = z.object({
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

type ObjectiveFormData = z.infer<typeof objectiveSchema>;

interface PositionObjectiveManagerProps {
    positionId: number;
}

interface ObjectiveItem {
    id: number;
    description: string;
    position: number;
}

export function PositionObjectiveManager({ positionId }: PositionObjectiveManagerProps) {
    const [objectives, setObjectives] = useState<ObjectiveItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [objectiveToDelete, setObjectiveToDelete] = useState<number | null>(null);

    const form = useForm<ObjectiveFormData>({
        resolver: zodResolver(objectiveSchema) as Resolver<ObjectiveFormData>,
        defaultValues: {
            description: "",
        }
    });

    const { setError, clearErrors, formState: { errors }, reset } = form;

    const fetchObjectives = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/api/organization/positions/${positionId}/objectives/`);
            setObjectives(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            console.error("Error loading objectives:", error);
            toast.error("Error al cargar objetivos");
        } finally {
            setLoading(false);
        }
    }, [positionId]);

    useEffect(() => {
        if (positionId) fetchObjectives();
    }, [positionId, fetchObjectives]);

    const handleCreate = () => {
        setEditingId(null);
        setServerError(null);
        clearErrors();
        reset({ description: "" });
        setIsModalOpen(true);
    };

    const handleEdit = (item: ObjectiveItem) => {
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

    const onSubmit = async (data: ObjectiveFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const payload = {
                description: data.description,
                position: positionId
            };

            if (editingId) {
                await apiClient.patch(`/api/organization/positions/${positionId}/objectives/${editingId}/`, payload);
                toast.success("Objetivo actualizado exitosamente");
            } else {
                await apiClient.post(`/api/organization/positions/${positionId}/objectives/`, payload);
                toast.success("Objetivo agregado exitosamente");
            }

            setIsModalOpen(false);
            fetchObjectives();

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
        setObjectiveToDelete(id);
        setIsDeleteAlertOpen(true);
    };

    const deleteObjectiveAction = useCallback(async () => {
        if (!objectiveToDelete) return;
        await apiClient.delete(`/api/organization/positions/${positionId}/objectives/${objectiveToDelete}/`);
        fetchObjectives();
    }, [objectiveToDelete, positionId, fetchObjectives]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objetivos
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
                        ) : objectives.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                    No hay objetivos registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            objectives.map((item) => (
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
                        <DialogTitle>{editingId ? "Editar Objetivo" : "Nuevo Objetivo"}</DialogTitle>
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
                                Descripción del Objetivo <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                {...form.register("description")}
                                placeholder="Ej: Liderar la implementación de nuevas estrategias de marketing digital..."
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
                onConfirmDelete={deleteObjectiveAction}
                successMessage="Objetivo eliminado exitosamente."
                genericErrorMessage="No se pudo eliminar el objetivo. Intente de nuevo."
            />
        </div>
    );
}
