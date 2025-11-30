"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Schema base
const baseSchema = z.object({
    first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    national_id_type: z.string().min(1, "Selecciona el tipo de documento"),
    national_id: z.string().min(5, "Cédula inválida"),
    phone_area_code: z.string().min(1, "Selecciona el código de área"),
    phone_subscriber: z.string().min(7, "El número debe tener al menos 7 dígitos"),
    cv_file: z
        .any()
        .refine((files) => {
            // Solo validar en el cliente
            if (typeof window === 'undefined') return true;
            return files?.length > 0;
        }, "El CV es obligatorio")
        .refine((files) => {
            // Solo validar en el cliente
            if (typeof window === 'undefined') return true;
            if (!files?.length) return true;
            return files[0]?.type === 'application/pdf';
        }, "El archivo debe ser un PDF"),
    avatar: z
        .any()
        .optional()
        .refine((files) => {
            if (typeof window === 'undefined') return true;
            if (!files?.length) return true;
            return files[0]?.type.startsWith('image/');
        }, "El archivo debe ser una imagen"),
});

// Schema dinámico se construirá en el componente

interface ApplicationFormProps {
    jobId: number;
    askEducation: boolean;
}

export default function ApplicationForm({
    jobId,
    askEducation,
}: ApplicationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitErrors, setSubmitErrors] = useState<string[]>([]);

    // Opciones para selectores
    const [eduOptions, setEduOptions] = useState<{ levels: any[], fields: any[] }>({ levels: [], fields: [] });
    const [phoneCodes, setPhoneCodes] = useState<any[]>([]);

    // Arrays para educación
    const [education, setEducation] = useState<any[]>([]);
    const [educationErrors, setEducationErrors] = useState<Record<number, Record<string, string>>>({});

    // Tipos de documento
    const documentTypes = [
        { value: "V", label: "V - Venezolano" },
        { value: "E", label: "E - Extranjero" },
        { value: "J", label: "J - Jurídico" },
        { value: "G", label: "G - Gubernamental" },
        { value: "P", label: "P - Pasaporte" },
    ];

    // Cargar opciones de educación y códigos de teléfono
    useEffect(() => {
        // Cargar códigos de teléfono (siempre)
        fetch("http://localhost:8000/api/ats/public/phone-codes/")
            .then(res => res.json())
            .then(data => setPhoneCodes(data))
            .catch(err => console.error("Error loading phone codes:", err));

        // Cargar educación (si se requiere)
        if (askEducation) {
            fetch("http://localhost:8000/api/ats/public/education-options/")
                .then(res => res.json())
                .then(data => setEduOptions(data))
                .catch(err => console.error("Error loading education options:", err));
        }
    }, [askEducation]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm({
        resolver: zodResolver(baseSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            national_id_type: "V",
            national_id: "",
            phone_area_code: "",
            phone_subscriber: "",
        },
    });

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);

        try {
            // Limpiar errores previos
            setSubmitErrors([]);

            // Validar campos dinámicos
            const errors: string[] = [];

            // Validar educación si es requerida
            let hasEduErrors = false;
            if (askEducation) {
                if (education.length === 0) {
                    errors.push("Debes agregar al menos un registro de educación.");
                } else {
                    const eduErrors: Record<number, Record<string, string>> = {};

                    education.forEach((edu, index) => {
                        const itemErrors: Record<string, string> = {};

                        // Validaciones
                        if (!edu.school_name) itemErrors.school_name = "La institución es obligatoria";
                        else if (/\d/.test(edu.school_name)) itemErrors.school_name = "No debe contener números";

                        if (!edu.level_name) itemErrors.level_name = "El nivel es obligatorio";

                        if (!edu.field_name) itemErrors.field_name = "El área es obligatoria";
                        else if (/\d/.test(edu.field_name)) itemErrors.field_name = "No debe contener números";

                        if (!edu.start_date) itemErrors.start_date = "La fecha de inicio es obligatoria";

                        if (edu.start_date && edu.end_date) {
                            if (new Date(edu.start_date) > new Date(edu.end_date)) {
                                itemErrors.end_date = "La fecha fin debe ser mayor a la inicio";
                            }
                        }

                        if (Object.keys(itemErrors).length > 0) {
                            eduErrors[index] = itemErrors;
                            hasEduErrors = true;
                        }
                    });

                    setEducationErrors(eduErrors);
                }
            }

            if (errors.length > 0 || hasEduErrors) {
                setSubmitErrors(errors);
                setIsSubmitting(false);
                return;
            }

            // Crear FormData
            const formData = new FormData();
            formData.append("job_posting", jobId.toString());
            formData.append("first_name", data.first_name);
            formData.append("last_name", data.last_name);
            formData.append("email", data.email);
            formData.append("phone_area_code", data.phone_area_code);
            formData.append("phone_subscriber", data.phone_subscriber);
            formData.append("national_id", `${data.national_id_type}-${data.national_id}`);
            formData.append("cv_file", data.cv_file[0]);
            if (data.avatar && data.avatar.length > 0) {
                formData.append("avatar", data.avatar[0]);
            }

            // Agregar educación si aplica
            if (askEducation && education.length > 0) {
                formData.append("education", JSON.stringify(education));
            }

            const response = await fetch("http://localhost:8000/api/ats/public/apply/", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Parsear errores del backend
                let errorMessage = "Error al enviar la postulación";

                if (errorData) {
                    // Si hay errores de validación de campos específicos
                    const errors = [];
                    for (const [field, messages] of Object.entries(errorData)) {
                        if (Array.isArray(messages)) {
                            errors.push(...messages);
                        } else if (typeof messages === 'string') {
                            errors.push(messages);
                        }
                    }

                    if (errors.length > 0) {
                        setSubmitErrors(errors);
                        setIsSubmitting(false);
                        return;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                }

                throw new Error(errorMessage);
            }

            setSubmitSuccess(true);
            reset();
            setEducation([]);
        } catch (error: any) {
            console.error("Error submitting application:", error);
            setSubmitErrors([error.message || "Error al enviar la postulación"]);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <Send className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900">¡Postulación Enviada!</h3>
                    <p className="text-slate-600">
                        Hemos recibido tu aplicación. Te contactaremos pronto.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => setSubmitSuccess(false)}
                    >
                        Enviar otra postulación
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-8 shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Error Messages */}
                {submitErrors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Por favor corrige los siguientes errores</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-2 list-disc list-inside space-y-1">
                                {submitErrors.map((error, index) => (
                                    <li key={index}>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
                {/* Información Personal */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Información Personal</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="first_name">Nombre *</Label>
                            <Input id="first_name" {...register("first_name")} />
                            {errors.first_name && (
                                <p className="mt-1 text-sm text-red-600">{errors.first_name.message as string}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="last_name">Apellido *</Label>
                            <Input id="last_name" {...register("last_name")} />
                            {errors.last_name && (
                                <p className="mt-1 text-sm text-red-600">{errors.last_name.message as string}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" {...register("email")} />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="phone_area_code">Teléfono *</Label>
                            <div className="grid grid-cols-5 gap-2">
                                <div className="col-span-2">
                                    <Controller
                                        name="phone_area_code"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Código" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {phoneCodes.map((code) => (
                                                        <SelectItem key={code.id} value={code.id.toString()}>
                                                            {code.code}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.phone_area_code && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone_area_code.message as string}</p>
                                    )}
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        id="phone_subscriber"
                                        placeholder="1234567"
                                        {...register("phone_subscriber")}
                                    />
                                    {errors.phone_subscriber && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone_subscriber.message as string}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <div>
                            <Label htmlFor="national_id_type">Tipo *</Label>
                            <Controller
                                name="national_id_type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.national_id_type && (
                                <p className="mt-1 text-sm text-red-600">{errors.national_id_type.message as string}</p>
                            )}
                        </div>
                        <div className="col-span-3">
                            <Label htmlFor="national_id">Número de Cédula *</Label>
                            <Input id="national_id" placeholder="12345678" {...register("national_id")} />
                            {errors.national_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.national_id.message as string}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="avatar">Foto de Perfil (Opcional)</Label>
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                {...register("avatar")}
                                className="cursor-pointer"
                            />
                            {errors.avatar && (
                                <p className="mt-1 text-sm text-red-600">{errors.avatar.message as string}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="cv_file">Currículum (PDF) *</Label>
                            <Input
                                id="cv_file"
                                type="file"
                                accept=".pdf"
                                {...register("cv_file")}
                                className="cursor-pointer"
                            />
                            {errors.cv_file && (
                                <p className="mt-1 text-sm text-red-600">{errors.cv_file.message as string}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Educación (si se requiere) */}
                {askEducation && (
                    <div className="space-y-4 border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Educación *</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newEdu = {
                                        school_name: "",
                                        level_name: "",
                                        field_name: "",
                                        start_date: "",
                                        end_date: "",
                                    };
                                    setEducation([...education, newEdu]);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar
                            </Button>
                        </div>

                        {education.map((edu, index) => (
                            <div key={index} className="rounded-lg border border-slate-200 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-medium">Educación {index + 1}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEducation(education.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Input
                                            placeholder="Institución"
                                            value={edu.school_name}
                                            onChange={(e) => {
                                                const newEdu = [...education];
                                                newEdu[index].school_name = e.target.value;
                                                setEducation(newEdu);
                                            }}
                                            className={educationErrors[index]?.school_name ? "border-red-500" : ""}
                                        />
                                        {educationErrors[index]?.school_name && (
                                            <p className="text-xs text-red-500">{educationErrors[index].school_name}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Select
                                                value={edu.level_name}
                                                onValueChange={(value) => {
                                                    const newEdu = [...education];
                                                    newEdu[index].level_name = value;
                                                    setEducation(newEdu);
                                                }}
                                            >
                                                <SelectTrigger className={educationErrors[index]?.level_name ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Nivel Académico" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eduOptions.levels.map((level) => (
                                                        <SelectItem key={level.id} value={level.name}>
                                                            {level.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {educationErrors[index]?.level_name && (
                                                <p className="text-xs text-red-500">{educationErrors[index].level_name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <Select
                                                value={edu.field_name}
                                                onValueChange={(value) => {
                                                    const newEdu = [...education];
                                                    newEdu[index].field_name = value;
                                                    setEducation(newEdu);
                                                }}
                                            >
                                                <SelectTrigger className={educationErrors[index]?.field_name ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Área de Estudio" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eduOptions.fields.map((field) => (
                                                        <SelectItem key={field.id} value={field.name}>
                                                            {field.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {educationErrors[index]?.field_name && (
                                                <p className="text-xs text-red-500">{educationErrors[index].field_name}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Input
                                                type="date"
                                                placeholder="Inicio"
                                                value={edu.start_date}
                                                onChange={(e) => {
                                                    const newEdu = [...education];
                                                    newEdu[index].start_date = e.target.value;
                                                    setEducation(newEdu);
                                                }}
                                                className={educationErrors[index]?.start_date ? "border-red-500" : ""}
                                            />
                                            {educationErrors[index]?.start_date && (
                                                <p className="text-xs text-red-500">{educationErrors[index].start_date}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Input
                                                type="date"
                                                placeholder="Fin (opcional)"
                                                value={edu.end_date}
                                                onChange={(e) => {
                                                    const newEdu = [...education];
                                                    newEdu[index].end_date = e.target.value;
                                                    setEducation(newEdu);
                                                }}
                                                className={educationErrors[index]?.end_date ? "border-red-500" : ""}
                                            />
                                            {educationErrors[index]?.end_date && (
                                                <p className="text-xs text-red-500">{educationErrors[index].end_date}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {education.length === 0 && (
                            <p className="text-sm text-slate-500">
                                Haz clic en "Agregar" para incluir tu información educativa
                            </p>
                        )}
                    </div>
                )}





                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-5 w-5" />
                            Enviar Postulación
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
