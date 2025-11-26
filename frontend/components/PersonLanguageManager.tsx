'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, Plus, Trash2, Languages, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from '@/lib/utils'; // Importante para estilos condicionales

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

// Esquema
const languageSchema = z.object({
    language: z.string().min(1, "Seleccione el idioma."),
    speaking_proficiency: z.string().optional(),
    reading_proficiency: z.string().optional(),
    writing_proficiency: z.string().optional(),
});

type LanguageFormData = z.infer<typeof languageSchema>;

export function PersonLanguageManager({ personId }: { personId: number }) {
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
    const fetchLanguages = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/talent/person-languages/?person=${personId}`);
            setItems(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando idiomas.");
        } finally {
            setIsLoading(false);
        }
    }, [personId]);

    useEffect(() => { fetchLanguages(); }, [fetchLanguages]);

    // Formulario
    const form = useForm<LanguageFormData>({
        resolver: zodResolver(languageSchema)
    });

    const openModal = (item?: any) => {
        setServerError(null);
        setEditingId(item?.id || null);
        if (item) {
            form.reset({
                language: String(item.language),
                speaking_proficiency: item.speaking_proficiency ? String(item.speaking_proficiency) : '',
                reading_proficiency: item.reading_proficiency ? String(item.reading_proficiency) : '',
                writing_proficiency: item.writing_proficiency ? String(item.writing_proficiency) : '',
            });
        } else {
            form.reset({
                language: '', speaking_proficiency: '', reading_proficiency: '', writing_proficiency: ''
            });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: LanguageFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = {
                person: personId,
                language: Number(data.language),
                speaking_proficiency: data.speaking_proficiency ? Number(data.speaking_proficiency) : null,
                reading_proficiency: data.reading_proficiency ? Number(data.reading_proficiency) : null,
                writing_proficiency: data.writing_proficiency ? Number(data.writing_proficiency) : null,
            };

            if (editingId) {
                await apiClient.patch(`/api/talent/person-languages/${editingId}/`, payload);
                toast.success("Idioma actualizado exitosamente.");
            } else {
                await apiClient.post('/api/talent/person-languages/', payload);
                toast.success("Idioma agregado exitosamente.");
            }

            setIsModalOpen(false);
            fetchLanguages();
        } catch (error: any) {
            // Manejo básico de errores del backend
            if (error.response?.data) {
                const errorData = error.response.data;
                // Si es un error de duplicado (unique constraint)
                if (JSON.stringify(errorData).includes("unique") || JSON.stringify(errorData).includes("existe")) {
                    setServerError("Este idioma ya está registrado para esta persona.");
                } else {
                    setServerError("Ocurrió un error al guardar los datos.");
                }
            } else {
                setServerError("Error de conexión.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Preparar eliminación
    const handleDeleteClick = (item: any) => {
        setItemToDelete({ id: item.id, name: item.language_name });
        setIsDeleteAlertOpen(true);
    };

    // Acción de eliminación real
    const deleteItemAction = async () => {
        if (!itemToDelete) return;
        await apiClient.delete(`/api/talent/person-languages/${itemToDelete.id}/`);
        fetchLanguages();
    };

    return (
        <div className="space-y-4">
            {/* ENCABEZADO DE SECCIÓN */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Languages className="size-5" />
                    Idiomas Dominados
                </h3>
                <Button type="button" size="sm" onClick={() => openModal()}>
                    <Plus className="size-4 mr-2" /> Agregar
                </Button>
            </div>

            {/* TABLA ESTILIZADA */}
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Idioma</TableHead>
                            <TableHead>Habla</TableHead>
                            <TableHead>Lectura</TableHead>
                            <TableHead>Escritura</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6">Cargando...</TableCell></TableRow>
                        ) : items.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No se han registrado idiomas.</TableCell></TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.language_name}</TableCell>
                                    <TableCell>{item.speaking_proficiency_name || '-'}</TableCell>
                                    <TableCell>{item.reading_proficiency_name || '-'}</TableCell>
                                    <TableCell>{item.writing_proficiency_name || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(item)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(item)}
                                            >
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

            {/* MODAL AGREGAR */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{editingId ? "Editar Idioma" : "Agregar Idioma"}</DialogTitle></DialogHeader>

                    <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4 py-2">

                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Selección de Idioma */}
                        <div className="space-y-1">
                            <Label className={cn("text-sm", { "text-destructive": form.formState.errors.language })}>
                                Idioma <span className="text-destructive">*</span>
                            </Label>
                            <Controller control={form.control} name="language" render={({ field }) => (
                                <DynamicCombobox
                                    field={{ name: 'language', label: 'Idioma', type: 'select', optionsEndpoint: '/api/talent/languages/' }}
                                    value={field.value} onChange={field.onChange}
                                    placeholder="Seleccione idioma..."
                                    hasError={!!form.formState.errors.language}
                                />
                            )} />
                            {form.formState.errors.language && <span className="text-xs font-medium text-destructive block">{form.formState.errors.language.message}</span>}
                        </div>

                        {/* Niveles (Grid de 3 columnas) */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground">Nivel Habla</Label>
                                <Controller control={form.control} name="speaking_proficiency" render={({ field }) => (
                                    <DynamicCombobox
                                        field={{ name: 'prof', label: 'Nivel', type: 'select', optionsEndpoint: '/api/talent/language-proficiencies/' }}
                                        value={field.value} onChange={field.onChange} placeholder="-"
                                    />
                                )} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground">Nivel Lectura</Label>
                                <Controller control={form.control} name="reading_proficiency" render={({ field }) => (
                                    <DynamicCombobox
                                        field={{ name: 'prof', label: 'Nivel', type: 'select', optionsEndpoint: '/api/talent/language-proficiencies/' }}
                                        value={field.value} onChange={field.onChange} placeholder="-"
                                    />
                                )} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground">Nivel Escritura</Label>
                                <Controller control={form.control} name="writing_proficiency" render={({ field }) => (
                                    <DynamicCombobox
                                        field={{ name: 'prof', label: 'Nivel', type: 'select', optionsEndpoint: '/api/talent/language-proficiencies/' }}
                                        value={field.value} onChange={field.onChange} placeholder="-"
                                    />
                                )} />
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

            {/* DIÁLOGO DE CONFIRMACIÓN DE BORRADO */}
            {itemToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteAlertOpen}
                    setOpen={setIsDeleteAlertOpen}
                    onConfirmDelete={deleteItemAction}
                    title="¿Eliminar Idioma?"
                    description={`¿Seguro que deseas eliminar el idioma ${itemToDelete.name}?`}
                    successMessage="Idioma eliminado exitosamente."
                />
            )}
        </div>
    );
}