'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, Save, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseBackendDate, cn } from '@/lib/utils';
import Image from 'next/image'; // Para optimización de imágenes
import { AxiosError } from 'axios';

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom
import { DatePicker } from "@/components/DatePicker";

// Esquema (Idéntico a Create)
const courseSchema = z.object({
    name: z.string().min(3, "Nombre obligatorio."),
    description: z.string().optional(),
    start_date: z.date("Fecha requerida."),
    end_date: z.date("Fecha requerida."),
    modality: z.string().min(1, "Requerido."),
    max_participants: z.coerce.number().min(1),
    duration_hours: z.coerce.number().min(0).optional(),
}).refine((data) => data.end_date >= data.start_date, {
    message: "La fecha de fin debe ser posterior.",
    path: ["end_date"],
});

type FormDataTypes = z.infer<typeof courseSchema>;

interface CourseEditModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    courseData: any; // Datos actuales del curso
    onSuccess: () => void;
}

export function CourseEditModal({ isOpen, setIsOpen, courseData, onSuccess }: CourseEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estados para imagen
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: "", description: "", modality: "", max_participants: 0, duration_hours: 0
        }
    });

    // Cargar datos al abrir
    useEffect(() => {
        if (courseData && isOpen) {
            form.reset({
                name: courseData.name,
                description: courseData.description || "",
                modality: courseData.modality,
                max_participants: courseData.max_participants,
                duration_hours: courseData.duration_hours,
                // Usamos el helper para evitar el error de zona horaria
                start_date: parseBackendDate(courseData.start_date),
                end_date: parseBackendDate(courseData.end_date),
            });

            // Cargar imagen existente si la hay
            if (courseData.cover_image) {
                setPreviewUrl(courseData.cover_image);
            } else {
                setPreviewUrl(null);
            }
            setCoverFile(null); // Limpiamos archivo seleccionado previo
        }
    }, [courseData, isOpen, form]);

    // Manejadores de Imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setCoverFile(null);
        setPreviewUrl(null);
        // Reset input
        const fileInput = document.getElementById('edit-course-cover') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const onSubmit = async (data: FormDataTypes) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            // USAMOS FORMDATA (Igual que en Create)
            const formData = new FormData();

            formData.append('name', data.name);
            formData.append('description', data.description || '');
            formData.append('modality', data.modality);
            formData.append('max_participants', String(data.max_participants));
            formData.append('duration_hours', String(data.duration_hours || 0));

            // Fechas formateadas
            if (data.start_date) formData.append('start_date', format(data.start_date, "yyyy-MM-dd"));
            if (data.end_date) formData.append('end_date', format(data.end_date, "yyyy-MM-dd"));

            // Imagen (Solo si se seleccionó una nueva)
            if (coverFile) {
                formData.append('cover_image', coverFile);
            }
            // Nota: Si quisieras BORRAR la imagen existente, necesitarías lógica extra en el backend
            // Por ahora, solo soportamos reemplazar o mantener la actual.

            await apiClient.patch(`/api/training/courses/${courseData.id}/`, formData, {
                headers: { "Content-Type": null }
            });

            toast.success("Curso actualizado.");
            onSuccess();
            setIsOpen(false);

        } catch (error: any) {
            if (error instanceof AxiosError && error.response?.data) {
                // Manejo básico de errores
                const msg = JSON.stringify(error.response.data);
                setServerError(`Error al actualizar: ${msg}`);
            } else {
                setServerError("Error de conexión.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Detalles del Curso</DialogTitle></DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    {serverError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{serverError}</AlertDescription></Alert>}

                    {/* Nombre */}
                    <div className="space-y-1">
                        <Label>Nombre</Label>
                        <Input {...form.register("name")} />
                        {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1">
                        <Label>Descripción</Label>
                        <Textarea {...form.register("description")} className="resize-none h-24" />
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Inicio</Label>
                            <Controller control={form.control} name="start_date" render={({ field }) => (
                                <DatePicker selected={field.value} onSelect={field.onChange} />
                            )} />
                        </div>
                        <div className="space-y-1">
                            <Label>Fin</Label>
                            <Controller control={form.control} name="end_date" render={({ field }) => (
                                <DatePicker selected={field.value} onSelect={field.onChange} />
                            )} />
                        </div>
                    </div>

                    {/* Configuración */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label>Modalidad</Label>
                            <Controller control={form.control} name="modality" render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRE">Presencial</SelectItem>
                                        <SelectItem value="VIR">Virtual (Síncrono)</SelectItem>
                                        <SelectItem value="ASY">Virtual (Asíncrono)</SelectItem>
                                        <SelectItem value="MIX">Híbrido</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <div className="space-y-1">
                            <Label>Cupo</Label>
                            <Input type="number" {...form.register("max_participants")} />
                        </div>
                    </div>

                    {/* Duración e Imagen */}
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1">
                            <Label>Duración (Horas)</Label>
                            <Input type="number" {...form.register("duration_hours")} />
                        </div>

                        {/* INPUT DE IMAGEN CON PREVIEW */}
                        <div className="space-y-1">
                            <Label>Portada</Label>
                            <div className="flex items-center gap-2">
                                <div className="relative h-16 w-24 bg-muted rounded-md overflow-hidden border flex items-center justify-center shrink-0">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized // Necesario para URLs locales y externas sin loader
                                        />
                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-1">
                                    <Input
                                        id="edit-course-cover"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="h-8 text-xs file:text-xs"
                                    />
                                    {/* Botón quitar solo limpia la selección local, no borra del server (por ahora) */}
                                    {coverFile && (
                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs justify-start px-0 text-muted-foreground hover:text-destructive" onClick={handleRemoveImage}>
                                            <X className="h-3 w-3 mr-1" /> Cancelar cambio
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}