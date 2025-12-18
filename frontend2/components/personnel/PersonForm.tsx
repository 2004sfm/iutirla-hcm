"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { parseBackendDate } from "@/lib/utils";

const fetcher = (url: string) => apiClient.get(url).then(res => res.data.results || res.data);

const sanitizeCedulaNumber = (value: string): string => {
    let sanitized = value.replace(/[.,]/g, '');
    sanitized = sanitized.replace(/^0+/, '');
    return sanitized || '0';
};

const personSchema = z.object({
    first_name: z.string()
        .min(1, "El primer nombre es requerido")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "El nombre solo puede contener letras"),
    second_name: z.string().optional()
        .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(val), "El segundo nombre solo puede contener letras"),
    paternal_surname: z.string()
        .min(1, "El apellido paterno es requerido")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "El apellido solo puede contener letras"),
    maternal_surname: z.string().optional()
        .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(val), "El apellido materno solo puede contener letras"),
    gender: z.string().min(1, "El género es requerido").or(z.literal("")).refine(val => val !== "", "El género es requerido"),
    marital_status: z.string().optional().or(z.literal("")),
    birthdate: z.string()
        .min(1, "La fecha de nacimiento es requerida")
        .refine((val) => {
            const date = new Date(val);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date <= today;
        }, "La fecha de nacimiento no puede ser futura"),
    country_of_birth: z.string().min(1, "El país de nacimiento es requerido").or(z.literal("")).refine(val => val !== "", "El país de nacimiento es requerido"),
    cedula_prefix: z.string().min(1, "El prefijo es requerido"),
    cedula_number: z.string()
        .min(1, "El número de cédula es requerido")
        .refine((val) => {
            const sanitized = sanitizeCedulaNumber(val);
            return /^\d+$/.test(sanitized);
        }, "El número de cédula solo puede contener dígitos")
        .refine((val) => {
            const sanitized = sanitizeCedulaNumber(val);
            return sanitized.length >= 1 && sanitized.length <= 8;
        }, "El número de cédula debe tener entre 1 y 8 dígitos"),
});

export type PersonFormData = z.infer<typeof personSchema>;

interface PersonFormProps {
    initialData?: any;
    isEditing?: boolean;
    personId?: string;
    onSuccess?: () => void;
}

export function PersonForm({ initialData, isEditing = false, personId, onSuccess }: PersonFormProps) {
    const router = useRouter();
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoRemoved, setPhotoRemoved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: genders } = useSWR("/api/core/genders/", fetcher);
    const { data: maritalStatuses } = useSWR("/api/core/marital-statuses/", fetcher);
    const { data: countries } = useSWR("/api/core/countries/?page_size=1000", fetcher);

    // Prepare default values
    const defaultValues = {
        first_name: initialData?.first_name || "",
        second_name: initialData?.second_name || "",
        paternal_surname: initialData?.paternal_surname || "",
        maternal_surname: initialData?.maternal_surname || "",
        gender: initialData?.gender?.toString() || "",
        marital_status: initialData?.marital_status?.toString() || "",
        birthdate: initialData?.birthdate || "",
        country_of_birth: initialData?.country_of_birth?.toString() || "",
        cedula_prefix: initialData?.national_ids?.find((n: any) => n.category === 'CEDULA')?.document_type || "",
        cedula_number: initialData?.national_ids?.find((n: any) => n.category === 'CEDULA')?.number || "",
    };

    const { register, handleSubmit, formState: { errors }, setValue, watch, setError } = useForm<PersonFormData>({
        resolver: zodResolver(personSchema),
        defaultValues
    });

    const onSubmit = async (data: PersonFormData) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // Append basic fields
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'cedula_prefix' && key !== 'cedula_number') {
                    if (value) formData.append(key, value);
                }
            });

            // Handle Cedula (only for create, or if we decide to allow editing cedula via this form)
            // For edit, we might need special handling if cedula changes are allowed
            if (!isEditing) {
                formData.append('cedula_prefix', data.cedula_prefix);
                formData.append('cedula_number', sanitizeCedulaNumber(data.cedula_number));
            } else {
                // If editing, we might want to update the cedula if it changed?
                // The backend serializer might not handle nested write for national_ids easily on update without custom logic.
                // For now, let's include them and see if backend handles it or if we need a separate endpoint.
                // Given the serializer structure, write_only fields might be ignored on update unless we override update()
                formData.append('cedula_prefix', data.cedula_prefix);
                formData.append('cedula_number', sanitizeCedulaNumber(data.cedula_number));
            }

            // Append photo if selected
            if (photoFile) {
                formData.append('photo', photoFile);
            } else if (photoRemoved && initialData?.photo) {
                formData.append('photo', 'DELETE');
            }

            if (isEditing && personId) {
                await apiClient.patch(`/api/core/persons/${personId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success("Persona actualizada exitosamente");
            } else {
                await apiClient.post("/api/core/persons/", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success("Persona creada exitosamente");
                router.push("/admin/personnel/people");
            }

            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Error submitting form:", error);
            if (error.response?.data) {
                const serverErrors = error.response.data;
                Object.keys(serverErrors).forEach((key) => {
                    if (key in defaultValues) {
                        setError(key as keyof PersonFormData, {
                            type: "server",
                            message: serverErrors[key][0] || serverErrors[key]
                        });
                    } else {
                        toast.error(`Error: ${serverErrors[key]}`);
                    }
                });
            } else {
                toast.error("Ocurrió un error al guardar la persona");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? "Editar Información Personal" : "Información Personal"}</CardTitle>
                    <CardDescription>{isEditing ? "Actualiza los datos de la persona" : "Completa los datos de la persona"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Personal Info Fields */}
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className={errors.first_name ? "text-destructive" : ""}>Primer Nombre *</Label>
                            <Input id="first_name" className={`text-sm ${errors.first_name ? "border-destructive" : ""}`} {...register("first_name")} />
                            {errors.first_name && (
                                <p className="text-sm text-destructive">{errors.first_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="second_name" className={errors.second_name ? "text-destructive" : ""}>Segundo Nombre</Label>
                            <Input id="second_name" className={`text-sm ${errors.second_name ? "border-destructive" : ""}`} {...register("second_name")} />
                            {errors.second_name && (
                                <p className="text-sm text-destructive">{errors.second_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paternal_surname" className={errors.paternal_surname ? "text-destructive" : ""}>Apellido Paterno *</Label>
                            <Input id="paternal_surname" className={`text-sm ${errors.paternal_surname ? "border-destructive" : ""}`} {...register("paternal_surname")} />
                            {errors.paternal_surname && (
                                <p className="text-sm text-destructive">{errors.paternal_surname.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maternal_surname" className={errors.maternal_surname ? "text-destructive" : ""}>Apellido Materno</Label>
                            <Input id="maternal_surname" className={`text-sm ${errors.maternal_surname ? "border-destructive" : ""}`} {...register("maternal_surname")} />
                            {errors.maternal_surname && (
                                <p className="text-sm text-destructive">{errors.maternal_surname.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender" className={errors.gender ? "text-destructive" : ""}>Género *</Label>
                            <Combobox
                                options={genders?.map((g: any) => ({ value: g.id.toString(), label: g.name })) || []}
                                value={watch("gender")}
                                onSelect={(value) => setValue("gender", value.toString())}
                                placeholder="Seleccionar género"
                                className={errors.gender ? "border-destructive" : ""}
                            />
                            {errors.gender && (
                                <p className="text-sm text-destructive">{errors.gender.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="marital_status">Estado Civil</Label>
                            <Combobox
                                options={maritalStatuses?.map((ms: any) => ({ value: ms.id.toString(), label: ms.name })) || []}
                                value={watch("marital_status")}
                                onSelect={(value) => setValue("marital_status", value.toString())}
                                placeholder="Seleccionar estado civil"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Fecha de Nacimiento *</Label>
                            <DatePicker
                                value={parseBackendDate(watch("birthdate"))}
                                onChange={(date) => {
                                    setValue("birthdate", date ? format(date, "yyyy-MM-dd") : "");
                                }}
                            />
                            {errors.birthdate && (
                                <p className="text-sm text-destructive">{errors.birthdate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country_of_birth" className={errors.country_of_birth ? "text-destructive" : ""}>País de Nacimiento *</Label>
                            <Combobox
                                options={(countries?.results || (Array.isArray(countries) ? countries : []))?.map((c: any) => ({ value: c.id.toString(), label: c.name })) || []}
                                value={watch("country_of_birth")}
                                onSelect={(value) => setValue("country_of_birth", value.toString())}
                                placeholder="Seleccionar país"
                                className={errors.country_of_birth ? "border-destructive" : ""}
                            />
                            {errors.country_of_birth && (
                                <p className="text-sm text-destructive">{errors.country_of_birth.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className={errors.cedula_prefix || errors.cedula_number ? "text-destructive" : ""}>Cédula *</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <Select
                                        value={watch("cedula_prefix")}
                                        onValueChange={(value) => setValue("cedula_prefix", value)}
                                    >
                                        <SelectTrigger className={`w-full ${errors.cedula_prefix ? "border-destructive" : ""}`}>
                                            <SelectValue placeholder="-" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["V", "E"].map((prefix) => (
                                                <SelectItem key={prefix} value={prefix}>
                                                    {prefix}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.cedula_prefix && (
                                        <p className="text-sm text-destructive mt-1">{errors.cedula_prefix.message}</p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        {...register("cedula_number")}
                                        placeholder="12345678"
                                        className={`text-sm ${errors.cedula_number ? "border-destructive" : ""}`}
                                    />
                                    {errors.cedula_number && (
                                        <p className="text-sm text-destructive mt-1">{errors.cedula_number.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Foto</Label>
                            <FileUpload
                                onFileSelect={(file) => {
                                    setPhotoFile(file);
                                    if (file) setPhotoRemoved(false);
                                }}
                                accept="image/*"
                                currentFile={photoFile}
                                initialPreviewUrl={initialData?.photo}
                                onRemove={() => setPhotoRemoved(true)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Formatos permitidos: JPG, PNG. Máximo 5MB.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : (isEditing ? "Actualizar" : "Crear Persona")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
