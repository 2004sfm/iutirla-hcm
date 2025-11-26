'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, Plus, Trash2, GraduationCap, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from '@/lib/utils';

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { DatePicker } from "@/components/DatePicker";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

// Esquema
const educationSchema = z.object({
    school_name: z.string().min(2, "Nombre de la institución requerido."),
    level: z.string().min(1, "Seleccione el nivel."),
    field_of_study: z.string().min(1, "Seleccione el área de estudio."),
    start_date: z.date({ message: "Fecha de inicio requerida." }),
    end_date: z.date().optional().nullable(),
}).refine((data) => {
    if (data.end_date && data.start_date && data.end_date < data.start_date) {
        return false;
    }
    return true;
}, { message: "La fecha de fin no puede ser anterior al inicio.", path: ["end_date"] });

type EducationFormData = z.infer<typeof educationSchema>;

export function PersonEducationManager({ personId }: { personId: number }) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Estados Delete
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

    // Fetch
    const fetchEducation = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/talent/education/?person=${personId}`);
            setItems(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando educación.");
        } finally {
            setIsLoading(false);
        }
    }, [personId]);

    useEffect(() => { fetchEducation(); }, [fetchEducation]);

    // Form
    const form = useForm<EducationFormData>({
        resolver: zodResolver(educationSchema),
        defaultValues: { school_name: "", level: "", field_of_study: "", start_date: undefined, end_date: null }
    });

    const openModal = (item?: any) => {
        setServerError(null);
        setEditingId(item?.id || null);
        if (item) {
            form.reset({
                school_name: item.school_name,
                level: String(item.level),
                field_of_study: String(item.field_of_study),
                start_date: new Date(item.start_date),
                end_date: item.end_date ? new Date(item.end_date) : null,
            });
        } else {
            form.reset({ school_name: "", level: "", field_of_study: "", start_date: undefined, end_date: null });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: EducationFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = {
                person: personId,
                school_name: data.school_name,
                level: Number(data.level),
                field_of_study: Number(data.field_of_study),
                start_date: format(data.start_date, "yyyy-MM-dd"),
                end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
            };

            if (editingId) {
                await apiClient.patch(`/api/talent/education/${editingId}/`, payload);
                toast.success("Registro educativo actualizado exitosamente.");
            } else {
                await apiClient.post('/api/talent/education/', payload);
                toast.success("Registro educativo agregado exitosamente.");
            }

            setIsModalOpen(false);
            fetchEducation();
        } catch (error) {
            setServerError("No se pudo guardar el registro. Verifique los datos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminar
    const handleDeleteClick = (item: any) => {
        setItemToDelete({ id: item.id, name: item.school_name });
        setIsDeleteAlertOpen(true);
    };

    const deleteItemAction = async () => {
        if (!itemToDelete) return;
        await apiClient.delete(`/api/talent/education/${itemToDelete.id}/`);
        fetchEducation();
    };

    return (
        <div className="space-y-4">
            {/* HEADER SECCIÓN */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <GraduationCap className="size-5" />
                    Formación Académica
                </h3>
                <Button type="button" size="sm" onClick={() => openModal()}>
                    <Plus className="size-4 mr-2" /> Agregar
                </Button>
            </div>

            {/* TABLA */}
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Institución</TableHead>
                            <TableHead>Nivel</TableHead>
                            <TableHead>Área / Título</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6">Cargando...</TableCell></TableRow>
                        ) : items.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Sin registros académicos.</TableCell></TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.school_name}</TableCell>
                                    <TableCell>{item.level_name}</TableCell>
                                    <TableCell>{item.field_of_study_name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {item.start_date} - {item.end_date || "Actualidad"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(item)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDeleteClick(item)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader><DialogTitle>{editingId ? "Editar Estudio" : "Agregar Estudio"}</DialogTitle></DialogHeader>

                    <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4 py-2">

                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Institución */}
                        <div className="space-y-1">
                            <Label className={cn("text-sm", { "text-destructive": form.formState.errors.school_name })}>
                                Nombre de la Institución <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="school_name"
                                control={form.control}
                                render={({ field }) => <Input {...field} className="text-sm" placeholder="Ej: Universidad Central..." />}
                            />
                            {form.formState.errors.school_name && <span className="text-xs font-medium text-destructive block">{form.formState.errors.school_name.message}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Nivel */}
                            <div className="space-y-1">
                                <Label className={cn("text-sm", { "text-destructive": form.formState.errors.level })}>
                                    Nivel Académico <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="level"
                                    control={form.control}
                                    render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'level', label: 'Nivel', type: 'select', optionsEndpoint: '/api/talent/education-levels/' }}
                                            value={field.value} onChange={field.onChange} placeholder="Seleccione..."
                                            hasError={!!form.formState.errors.level}
                                        />
                                    )}
                                />
                                {form.formState.errors.level && <span className="text-xs font-medium text-destructive block">{form.formState.errors.level.message}</span>}
                            </div>

                            {/* Campo de Estudio */}
                            <div className="space-y-1">
                                <Label className={cn("text-sm", { "text-destructive": form.formState.errors.field_of_study })}>
                                    Área / Título <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="field_of_study"
                                    control={form.control}
                                    render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'field', label: 'Área', type: 'select', optionsEndpoint: '/api/talent/fields-of-study/' }}
                                            value={field.value} onChange={field.onChange} placeholder="Seleccione..."
                                            hasError={!!form.formState.errors.field_of_study}
                                        />
                                    )}
                                />
                                {form.formState.errors.field_of_study && <span className="text-xs font-medium text-destructive block">{form.formState.errors.field_of_study.message}</span>}
                            </div>
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className={cn("text-sm", { "text-destructive": form.formState.errors.start_date })}>
                                    Fecha Inicio <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="start_date"
                                    control={form.control}
                                    render={({ field }) => <DatePicker selected={field.value} onSelect={field.onChange} className={cn("w-full", form.formState.errors.start_date && "border-destructive")} />}
                                />
                                {form.formState.errors.start_date && <span className="text-xs font-medium text-destructive block">{form.formState.errors.start_date.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <Label className={cn("text-sm", { "text-destructive": form.formState.errors.end_date })}>Fecha Fin (Opcional)</Label>
                                <Controller
                                    name="end_date"
                                    control={form.control}
                                    render={({ field }) => <DatePicker selected={field.value || undefined} onSelect={field.onChange} className={cn("w-full", form.formState.errors.end_date && "border-destructive")} />}
                                />
                                {form.formState.errors.end_date && <span className="text-xs font-medium text-destructive block">{form.formState.errors.end_date.message}</span>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingId ? "Guardar Cambios" : "Guardar")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE DIALOG */}
            {itemToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteAlertOpen}
                    setOpen={setIsDeleteAlertOpen}
                    onConfirmDelete={deleteItemAction}
                    title="¿Eliminar Estudio?"
                    description={`¿Seguro que deseas eliminar el registro de ${itemToDelete.name}?`}
                    successMessage="Registro eliminado exitosamente."
                />
            )}
        </div>
    );
}