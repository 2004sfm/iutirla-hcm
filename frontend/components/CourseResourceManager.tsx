'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, Plus, Trash2, FileText, Link as LinkIcon, Download, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

// Esquema
const resourceSchema = z.object({
    name: z.string().min(3, "El título es obligatorio."),
    resource_type: z.string().min(1, "Seleccione el tipo."),
    url: z.string().optional(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface CourseResourceManagerProps {
    courseId: number;
    readOnly?: boolean; // <--- Propiedad clave para Estudiantes
}

export function CourseResourceManager({ courseId, readOnly = false }: CourseResourceManagerProps) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Delete
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

    const form = useForm<ResourceFormData>({
        resolver: zodResolver(resourceSchema),
        defaultValues: { name: "", resource_type: "FIL", url: "" }
    });

    const { control, handleSubmit, formState: { errors }, reset, watch, register, setError } = form;
    const currentType = watch("resource_type");

    // --- CARGA DE RECURSOS ---
    const fetchResources = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/training/resources/?course=${courseId}`);
            setItems(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando recursos.");
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => { fetchResources(); }, [fetchResources]);

    const openModal = () => {
        setServerError(null);
        setSelectedFile(null);
        reset({ name: "", resource_type: "FIL", url: "" });
        setIsModalOpen(true);
    };

    // --- SUBIR RECURSO ---
    const onSubmit = async (data: ResourceFormData) => {
        if (data.resource_type === 'FIL' && !selectedFile) {
            setError("root", { message: "Debe seleccionar un archivo." });
            return;
        }
        if (data.resource_type === 'URL' && !data.url) {
            setError("url", { message: "Debe ingresar el enlace." });
            return;
        }

        setIsSubmitting(true);
        setServerError(null);

        try {
            const formData = new FormData();
            formData.append('course', String(courseId));
            formData.append('name', data.name);
            formData.append('resource_type', data.resource_type);

            if (data.resource_type === 'FIL' && selectedFile) {
                formData.append('file', selectedFile);
                formData.append('url', '');
            } else {
                formData.append('url', data.url || '');
                formData.append('file', '');
            }

            // IMPORTANTE: Content-Type null para que axios maneje el boundary
            await apiClient.post('/api/training/resources/', formData, {
                headers: { "Content-Type": null }
            });

            toast.success("Recurso agregado.");
            setIsModalOpen(false);
            fetchResources();
        } catch (error: any) {
            setServerError("Error al subir el recurso.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- BORRAR RECURSO ---
    const handleDeleteClick = (item: any) => {
        setItemToDelete({ id: item.id, name: item.name });
        setIsDeleteAlertOpen(true);
    };

    const deleteItemAction = async () => {
        if (!itemToDelete) return;
        await apiClient.delete(`/api/training/resources/${itemToDelete.id}/`);
        fetchResources();
    };

    // --- RENDERS ---
    const renderResourceIcon = (type: string) => {
        return type === 'FIL'
            ? <FileText className="h-4 w-4 text-blue-500" />
            : <LinkIcon className="h-4 w-4 text-orange-500" />;
    };

    const renderActionLink = (item: any) => {
        if (item.resource_type === 'FIL' && item.file_url) {
            return (
                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 hover:underline font-medium">
                    <Download className="h-3 w-3 mr-1" /> Descargar
                </a>
            );
        }
        if (item.resource_type === 'URL' && item.url) {
            return (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-orange-600 hover:underline font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" /> Abrir Enlace
                </a>
            );
        }
        return <span className="text-xs text-muted-foreground">-</span>;
    };

    return (
        <div className="space-y-4">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    Material de Apoyo
                </h3>
                {/* Ocultar botón si es readOnly (Estudiante) */}
                {!readOnly && (
                    <Button size="sm" onClick={openModal}>
                        <Plus className="size-4 mr-2" /> Subir Recurso
                    </Button>
                )}
            </div>

            {/* TABLA */}
            <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Acceso</TableHead>
                            {/* Ocultar acciones si es readOnly */}
                            {!readOnly && <TableHead className="text-right w-[100px]">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6">Cargando...</TableCell></TableRow>
                        ) : items.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No hay materiales compartidos.</TableCell></TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{renderResourceIcon(item.resource_type)}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.resource_type === 'FIL' ? 'Archivo' : 'Enlace Externo'}
                                    </TableCell>
                                    <TableCell>{renderActionLink(item)}</TableCell>

                                    {/* Botones de borrar solo para Instructor */}
                                    {!readOnly && (
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteClick(item)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* MODAL SUBIR */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle>Compartir Recurso</DialogTitle></DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1">
                            <Label>Título <span className="text-destructive">*</span></Label>
                            <Input {...register("name")} placeholder="Ej: Guía de Estudio" />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label>Tipo</Label>
                            <Controller name="resource_type" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FIL">Archivo (PDF, Doc, Img)</SelectItem>
                                        <SelectItem value="URL">Enlace Web / Video</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                            {currentType === 'FIL' ? (
                                <div className="space-y-2">
                                    <Label>Seleccionar Archivo</Label>
                                    <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                    {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Pegar URL</Label>
                                    <Input {...register("url")} placeholder="https://..." />
                                    {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir"}
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
                    title="¿Eliminar Recurso?"
                    description={`¿Seguro que deseas eliminar "${itemToDelete.name}"?`}
                    successMessage="Recurso eliminado."
                />
            )}
        </div>
    );
}