"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { parseBackendDate } from "@/lib/utils";
import { CatalogHeader } from "@/components/CatalogHeader";
import { SimpleCombobox } from "@/components/SimpleCombobox";
import { DatePicker } from "@/components/DatePicker";
import { toast } from "sonner";

const jobSchema = z.object({
    title: z
        .string()
        .min(3, "El título debe tener al menos 3 caracteres")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El título solo puede contener letras y espacios"),
    department: z.string().min(1, "Debes seleccionar un departamento"),
    position: z.string().min(1, "Debes seleccionar una posición"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    location: z.string().optional(),
    closing_date: z.string().optional(),
    ask_education: z.boolean(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface Department {
    id: number;
    name: string;
}

interface Position {
    id: number;
    job_title_name: string; // Nombre del cargo (JobTitle)
    name?: string; // Nombre opcional de la posición
    department_name: string;
    department: number; // ID del departamento
    vacancies: number;
    active_employees_count: number;
    objectives: { description: string }[];
    requirements: { description: string }[];
}

export default function NewJobPage() {
    const router = useRouter();
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    // selectedDepartment eliminado, usaremos watch
    const [loading, setLoading] = useState(false);
    const [loadingPositions, setLoadingPositions] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: "",
            department: "",
            position: "",
            description: "",
            location: "Porlamar",
            ask_education: false,
        },
    });

    const selectedDepartment = watch("department");
    const selectedPosition = watch("position");
    const askEducation = watch("ask_education");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [posRes, depRes] = await Promise.all([
                apiClient.get("/api/organization/positions/"),
                apiClient.get("/api/organization/departments/"),
            ]);
            setPositions(posRes.data.results || posRes.data);
            setDepartments(depRes.data.results || depRes.data);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoadingPositions(false);
        }
    }

    async function onSubmit(data: JobFormData) {
        setLoading(true);
        const toastId = toast.loading('Creando vacante...');

        try {
            // Eliminamos department del payload ya que es redundante
            const { department, ...payload } = data;

            const res = await apiClient.post("/api/ats/jobs/", {
                ...payload,
                position: parseInt(data.position),
            });

            toast.success('Vacante creada exitosamente', { id: toastId });
            router.push(`/admin/ats/jobs/${res.data.id}`);
        } catch (error: any) {
            let errorMessage = "Error al crear la vacante";

            if (error.response?.data) {
                const data = error.response.data;
                // Si es un objeto con errores de campo (ej: { position: ["Error..."], title: ["Error..."] })
                if (typeof data === 'object' && data !== null) {
                    // Extraemos solo los mensajes de error, ignorando las claves (campos)
                    // Usamos reduce para aplanar el array de valores de forma segura
                    const messages = Object.values(data).reduce((acc: string[], val: any) => {
                        if (Array.isArray(val)) {
                            return acc.concat(val.map(String));
                        }
                        return acc.concat([String(val)]);
                    }, []);

                    if (messages.length > 0) {
                        errorMessage = messages.join("\n");
                    }
                } else {
                    errorMessage = String(data);
                }
            } else if (error.message && error.message !== "Request failed with status code 400") {
                // Solo usamos el mensaje de error técnico si no es el genérico de Axios
                errorMessage = error.message;
            }

            toast.error(errorMessage, { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    const filteredPositions = positions.filter((p) => {
        if (!selectedDepartment) return false;
        return p.department?.toString() === selectedDepartment;
    });

    const selectedPositionData = positions.find(
        (p) => p.id.toString() === selectedPosition
    );

    const breadcrumbItems = [
        { name: "Reclutamiento", href: "/admin/ats/jobs" },
        { name: "Vacantes", href: "/admin/ats/jobs" },
        { name: "Nueva Vacante", href: "/admin/ats/jobs/new" },
    ];

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* ... (Header) */}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Título de la Vacante *</Label>
                        <Input
                            id="title"
                            placeholder="Ej: Desarrollador Full Stack Senior"
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Selección de Departamento y Posición */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Departamento *</Label>
                            <SimpleCombobox
                                options={departments.map((d) => ({
                                    value: d.id.toString(),
                                    label: d.name,
                                }))}
                                value={selectedDepartment}
                                onChange={(value) => {
                                    setValue("department", value || "", { shouldValidate: true });
                                    setValue("position", ""); // Limpiar posición al cambiar departamento
                                }}
                                placeholder="Selecciona un departamento"
                                searchPlaceholder="Buscar departamento..."
                                emptyText="No se encontraron departamentos"
                            />
                            {errors.department && (
                                <p className="text-sm text-destructive">{errors.department.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Posición *</Label>
                            {loadingPositions ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando posiciones...
                                </div>
                            ) : (
                                <SimpleCombobox
                                    options={filteredPositions.map((p) => ({
                                        value: p.id.toString(),
                                        label: p.job_title_name || p.name || `Posición #${p.id}`,
                                    }))}
                                    value={selectedPosition}
                                    onChange={(value) => setValue("position", value || "", { shouldValidate: true })}
                                    placeholder="Selecciona una posición"
                                    searchPlaceholder="Buscar posición..."
                                    emptyText={
                                        selectedDepartment
                                            ? "No hay posiciones en este departamento"
                                            : "Selecciona un departamento primero"
                                    }
                                />
                            )}
                            {errors.position && (
                                <p className="text-sm text-destructive">{errors.position.message}</p>
                            )}
                        </div>
                    </div>

                    {selectedPositionData && (
                        <div className="rounded-md bg-muted p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold">
                                        {selectedPositionData.job_title_name || selectedPositionData.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPositionData.department_name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline gap-2 justify-end">
                                        <p className="text-2xl font-bold">
                                            {selectedPositionData.vacancies - (selectedPositionData.active_employees_count || 0)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            / {selectedPositionData.vacancies}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Vacantes Disponibles</p>
                                </div>
                            </div>

                            {/* Objetivos y Requisitos cargados del backend */}
                            <div className="mt-4 grid gap-4 md:grid-cols-2 border-t pt-4">
                                <div>
                                    <h5 className="font-semibold mb-2 text-sm">Objetivos</h5>
                                    {selectedPositionData.objectives && selectedPositionData.objectives.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                            {selectedPositionData.objectives.map((obj, i) => (
                                                <li key={i} className="break-words">{obj.description}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Sin objetivos definidos</p>
                                    )}
                                </div>
                                <div>
                                    <h5 className="font-semibold mb-2 text-sm">Requisitos</h5>
                                    {selectedPositionData.requirements && selectedPositionData.requirements.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                            {selectedPositionData.requirements.map((req, i) => (
                                                <li key={i} className="break-words">{req.description}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Sin requisitos definidos</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción *</Label>
                        <Textarea
                            id="description"
                            rows={6}
                            placeholder="Describe las responsabilidades y objetivos del puesto..."
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Input
                            id="location"
                            value="Porlamar"
                            disabled
                            className="bg-muted"
                            {...register("location")}
                        />
                    </div>


                    {/* Fecha de cierre */}
                    <div className="space-y-2 flex flex-col">
                        <Label htmlFor="closing_date">Fecha de Cierre Estimada</Label>
                        <DatePicker
                            selected={parseBackendDate(watch("closing_date"))}
                            onSelect={(date) => setValue("closing_date", date ? format(date, "yyyy-MM-dd") : "")}
                            placeholder="Selecciona una fecha"
                        />
                    </div>

                    {/* Requisitos del candidato */}
                    <div className="space-y-4 rounded-md border p-4">
                        <h3 className="font-semibold">Información requerida del candidato</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="ask_education" className="text-base">
                                        Educación
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Solicitar historial académico
                                    </p>
                                </div>
                                <Switch
                                    id="ask_education"
                                    checked={askEducation}
                                    onCheckedChange={(checked) => setValue("ask_education", checked)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Borrador
                                </>
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.push("/admin/ats/jobs")}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
