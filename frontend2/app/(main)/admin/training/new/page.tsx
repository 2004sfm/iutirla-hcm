"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { FileUpload } from "@/components/ui/file-upload";
import { format, parseISO } from "date-fns";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import useSWR from "swr";

const courseFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    cover_image: z.any().optional(),
    status: z.enum(["BOR", "PRO", "EJE", "FIN", "CAN"]),
    modality: z.enum(["PRE", "VIR", "ASY", "MIX"]),
    start_date: z.string().min(1, "La fecha de inicio es requerida"),
    end_date: z.string().min(1, "La fecha de fin es requerida"),
    duration_hours: z.number().min(1, "La duración debe ser mayor a 0"),
    max_participants: z.number().min(1, "El cupo máximo debe ser mayor a 0"),
    is_public: z.boolean(),
    department: z.number().optional(),
}).refine((data) => {
    if (data.start_date && data.end_date) {
        return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
}, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["end_date"],
}).refine((data) => {
    if (!data.is_public && !data.department) {
        return false;
    }
    return true;
}, {
    message: "Si el curso es privado, debe seleccionar un departamento",
    path: ["department"],
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function NewCoursePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch departments for the combobox
    const { data: departments } = useSWR("/api/organization/departments/", (url) =>
        apiClient.get(url).then(res => res.data.results || res.data)
    );

    const departmentOptions = departments?.map((d: any) => ({
        value: d.id,
        label: d.name
    })) || [];

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: {
            name: "",
            description: "",
            status: "BOR",
            modality: "PRE",
            start_date: "",
            end_date: "",
            duration_hours: 0,
            max_participants: 30,
            is_public: true,
        },
    });

    const isPublic = form.watch("is_public");

    const onSubmit = async (values: CourseFormValues) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", values.name);
            if (values.description) formData.append("description", values.description);
            if (values.cover_image) formData.append("cover_image", values.cover_image);
            formData.append("status", values.status);
            formData.append("modality", values.modality);
            formData.append("start_date", values.start_date);
            formData.append("end_date", values.end_date);
            formData.append("duration_hours", values.duration_hours.toString());
            formData.append("max_participants", values.max_participants.toString());

            // Privacy fields
            formData.append("is_public", values.is_public.toString());
            if (!values.is_public && values.department) {
                formData.append("department", values.department.toString());
            }

            const response = await apiClient.post("/api/training/courses/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            toast.success("Curso creado exitosamente");
            router.push(`/admin/training/${response.data.id}`);
        } catch (error: any) {
            console.error("Error creating course:", error);
            if (error.response?.data) {
                const errors = error.response.data;
                Object.keys(errors).forEach((key) => {
                    if (key in values) {
                        form.setError(key as any, {
                            message: Array.isArray(errors[key]) ? errors[key][0] : errors[key],
                        });
                    }
                });
            }
            toast.error("Error al crear el curso");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Curso</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Complete la información para registrar un nuevo curso
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Curso</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Nombre */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Curso *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Introducción a Python" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Descripción */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe los objetivos y contenido del curso"
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Estado y Modalidad */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado *</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={[
                                                        { value: "BOR", label: "Borrador" },
                                                        { value: "PRO", label: "Programado" },
                                                        { value: "EJE", label: "En Ejecución" },
                                                        { value: "FIN", label: "Finalizado" },
                                                        { value: "CAN", label: "Cancelado" },
                                                    ]}
                                                    value={field.value}
                                                    onSelect={field.onChange}
                                                    placeholder="Seleccione el estado"
                                                    emptyText="No se encontraron resultados"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="modality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Modalidad *</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={[
                                                        { value: "PRE", label: "Presencial" },
                                                        { value: "VIR", label: "Virtual (En Vivo / Zoom)" },
                                                        { value: "ASY", label: "Virtual (Autoaprendizaje)" },
                                                        { value: "MIX", label: "Híbrido / Mixto" },
                                                    ]}
                                                    value={field.value}
                                                    onSelect={field.onChange}
                                                    placeholder="Seleccione la modalidad"
                                                    emptyText="No se encontraron resultados"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha de Inicio *</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value ? parseISO(field.value) : undefined}
                                                    onChange={(date) => {
                                                        field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                                    }}
                                                    placeholder="Seleccione la fecha"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha de Fin *</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value ? parseISO(field.value) : undefined}
                                                    onChange={(date) => {
                                                        field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                                    }}
                                                    placeholder="Seleccione la fecha"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Duration and Max Participants */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="duration_hours"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duración (horas) *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="40"
                                                    {...field}
                                                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                                        const input = e.currentTarget;
                                                        // Remover ceros iniciales mientras el usuario escribe
                                                        if (input.value.length > 1 && input.value.startsWith('0')) {
                                                            input.value = input.value.replace(/^0+/, '');
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                                        field.onChange(isNaN(value) ? 0 : value);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="max_participants"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cupo Máximo *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="30"
                                                    {...field}
                                                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                                        const input = e.currentTarget;
                                                        // Remover ceros iniciales mientras el usuario escribe
                                                        if (input.value.length > 1 && input.value.startsWith('0')) {
                                                            input.value = input.value.replace(/^0+/, '');
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                                        field.onChange(isNaN(value) ? 0 : value);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Privacy Settings */}
                            <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                                <h3 className="font-medium text-sm">Configuración de Privacidad</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <FormField
                                        control={form.control}
                                        name="is_public"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Curso Público</FormLabel>
                                                    <div className="text-[0.8rem] text-muted-foreground">
                                                        Visible para todos los empleados
                                                    </div>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {!isPublic && (
                                        <FormField
                                            control={form.control}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Departamento *</FormLabel>
                                                    <FormControl>
                                                        <Combobox
                                                            options={departmentOptions}
                                                            value={field.value}
                                                            onSelect={(val) => field.onChange(val === "" ? undefined : val)}
                                                            placeholder="Seleccione departamento"
                                                            emptyText="No se encontraron departamentos"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Cover Image */}
                            <FormField
                                control={form.control}
                                name="cover_image"
                                render={({ field: { value, onChange, ...field } }) => (
                                    <FormItem>
                                        <FormLabel>Imagen de Portada</FormLabel>
                                        <FormControl>
                                            <FileUpload
                                                onFileSelect={onChange}
                                                currentFile={value}
                                                accept="image/*"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear Curso
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
