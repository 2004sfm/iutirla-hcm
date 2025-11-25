'use client';

import { useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image'; // <--- IMPORTANTE PARA LA IMAGEN

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Save, Image as ImageIcon, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom
import { DatePicker } from "@/components/DatePicker";
import { AxiosError } from 'axios';

// --- 1. ESQUEMA ZOD ---
const courseSchema = z.object({
    name: z.string().min(3, "El nombre es obligatorio (min 3 caracteres)."),
    description: z.string().optional(),

    // Fechas requeridas
    start_date: z.date("Fecha de inicio requerida."),
    end_date: z.date("Fecha de fin requerida."),

    modality: z.string().min(1, "Seleccione la modalidad."),

    // Conversión de string a número
    max_participants: z.coerce.number().min(1, "Mínimo 1 participante."),
    duration_hours: z.coerce.number().min(0, "Duración inválida.").optional(),

}).refine((data) => data.end_date >= data.start_date, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["end_date"],
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseCreateModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSuccess: () => void;
}

export function CourseCreateModal({ isOpen, setIsOpen, onSuccess }: CourseCreateModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estados para manejo de imagen
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<CourseFormData>({
        resolver: zodResolver(courseSchema) as Resolver<CourseFormData>,
        defaultValues: {
            name: "",
            description: "",
            modality: "PRE",
            max_participants: 20,
            duration_hours: 0,
            start_date: undefined,
            end_date: undefined,
        }
    });

    const { control, handleSubmit, formState: { errors }, reset, register, setError } = form;

    // Manejador de selección de imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Limpiar imagen seleccionada
    const handleRemoveImage = () => {
        setCoverFile(null);
        setPreviewUrl(null);
        // Reiniciar el input file (opcional pero recomendado)
        const fileInput = document.getElementById('course-cover-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const onSubmit = async (data: CourseFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            // 1. Usamos FormData porque estamos enviando un archivo
            const formData = new FormData();

            // 2. Añadimos campos de texto
            formData.append('name', data.name);
            formData.append('description', data.description || '');
            formData.append('modality', data.modality);
            formData.append('max_participants', String(data.max_participants));
            formData.append('duration_hours', String(data.duration_hours || 0));
            formData.append('status', 'BOR'); // Nace como Borrador

            // 3. Añadimos fechas formateadas (Evita error de zona horaria)
            if (data.start_date) formData.append('start_date', format(data.start_date, "yyyy-MM-dd"));
            if (data.end_date) formData.append('end_date', format(data.end_date, "yyyy-MM-dd"));

            // 4. Añadimos la imagen si existe
            if (coverFile) {
                formData.append('cover_image', coverFile);
            }

            // 5. Enviamos al Backend
            // Nota: No ponemos Content-Type manual, dejamos que el navegador/axios ponga el boundary correcto
            await apiClient.post('/api/training/courses/', formData, {
                headers: { "Content-Type": null }
            });

            toast.success("Curso creado exitosamente.");

            // Limpieza
            reset();
            setCoverFile(null);
            setPreviewUrl(null);
            onSuccess();
            setIsOpen(false);

        } catch (error) {
            console.error(error);
            if (error instanceof AxiosError && error.response?.data) {
                const serverErrors = error.response.data;
                let globalMsg = "";
                Object.keys(serverErrors).forEach((key) => {
                    const msg = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : String(serverErrors[key]);
                    if (key === 'non_field_errors' || key === 'detail') { globalMsg = msg; }
                    // Intentamos mapear errores de campos al formulario
                    else if (['name', 'description', 'start_date', 'end_date', 'modality'].includes(key)) {
                        setError(key as keyof CourseFormData, { type: 'server', message: msg });
                    } else {
                        // Si es un error de un campo que no está en el form (ej. cover_image), lo mostramos global
                        globalMsg = `${key}: ${msg}`;
                    }
                });
                if (globalMsg) setServerError(globalMsg);
            } else {
                setServerError("Error de conexión con el servidor.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Curso</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    {serverError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{serverError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Nombre */}
                    <div className="space-y-1">
                        <Label>Nombre del Curso <span className="text-destructive">*</span></Label>
                        <Input {...register("name")} placeholder="Ej: Seguridad Industrial Nivel 1" />
                        {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1">
                        <Label>Descripción Corta</Label>
                        <Textarea {...register("description")} placeholder="Objetivos y alcance..." className="resize-none h-20" />
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Fecha Inicio <span className="text-destructive">*</span></Label>
                            <Controller
                                name="start_date"
                                control={control}
                                render={({ field }) => <DatePicker selected={field.value} onSelect={field.onChange} />}
                            />
                            {errors.start_date && <span className="text-xs text-destructive">{errors.start_date.message}</span>}
                        </div>
                        <div className="space-y-1">
                            <Label>Fecha Fin <span className="text-destructive">*</span></Label>
                            <Controller
                                name="end_date"
                                control={control}
                                render={({ field }) => <DatePicker selected={field.value} onSelect={field.onChange} />}
                            />
                            {errors.end_date && <span className="text-xs text-destructive">{errors.end_date.message}</span>}
                        </div>
                    </div>

                    {/* Configuración */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 col-span-2">
                            <Label>Modalidad</Label>
                            <Controller
                                name="modality"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRE">Presencial</SelectItem>
                                            <SelectItem value="VIR">Virtual (Síncrono / Zoom)</SelectItem>
                                            <SelectItem value="ASY">Virtual (Autoaprendizaje)</SelectItem>
                                            <SelectItem value="MIX">Híbrido / Mixto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.modality && <span className="text-xs text-destructive">{errors.modality.message}</span>}
                        </div>

                        <div className="space-y-1">
                            <Label>Cupo Máx.</Label>
                            <Input type="number" {...register("max_participants")} />
                            {errors.max_participants && <span className="text-xs text-destructive">{errors.max_participants.message}</span>}
                        </div>
                    </div>

                    {/* Duración e Imagen */}
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1">
                            <Label>Duración (Horas)</Label>
                            <Input type="number" {...register("duration_hours")} />
                            {errors.duration_hours && <span className="text-xs text-destructive">{errors.duration_hours.message}</span>}
                        </div>

                        {/* INPUT DE IMAGEN CON PREVIEW */}
                        <div className="space-y-1">
                            <Label>Portada (Opcional)</Label>
                            <div className="flex items-center gap-2">
                                {/* Contenedor relativo para Next.js Image */}
                                <div className="relative h-16 w-24 bg-muted rounded-md overflow-hidden border flex items-center justify-center shrink-0">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized // Necesario para Blob URLs locales
                                        />
                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    {previewUrl ? (
                                        <Button type="button" variant="destructive" size="sm" className="h-8 text-xs w-full" onClick={handleRemoveImage}>
                                            <X className="h-3 w-3 mr-1" /> Quitar
                                        </Button>
                                    ) : (
                                        <Input
                                            id="course-cover-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="h-8 text-xs file:text-xs"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Crear Curso
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}