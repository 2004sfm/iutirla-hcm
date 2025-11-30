"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SimpleCombobox } from "@/components/SimpleCombobox";
import { DatePicker } from "@/components/DatePicker";
import { format } from "date-fns";
import { parseBackendDate } from "@/lib/utils";
import { Loader2, Send, XCircle, Users, Save } from "lucide-react";
import { JobPosting, JOB_STATUS_LABELS } from "@/types/ats";
import apiClient from "@/lib/apiClient";
import { CatalogHeader } from "@/components/CatalogHeader";

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
    job_title_name: string;
    name?: string;
    department_name: string;
    department: number;
    vacancies: number;
    active_employees_count: number;
    objectives: { description: string }[];
    requirements: { description: string }[];
}

export default function EditJobPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
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
        if (params.id) {
            loadData();
        }
    }, [params.id]);

    async function loadData() {
        try {
            const [jobRes, posRes, depRes] = await Promise.all([
                apiClient.get(`/api/ats/jobs/${params.id}/`),
                apiClient.get("/api/organization/positions/"),
                apiClient.get("/api/organization/departments/"),
            ]);

            const jobData = jobRes.data;
            setJob(jobData);
            setPositions(posRes.data.results || posRes.data);
            setDepartments(depRes.data.results || depRes.data);

            // Pre-cargar el formulario con los datos existentes
            const positionData = (posRes.data.results || posRes.data).find(
                (p: Position) => p.id === jobData.position
            );

            reset({
                title: jobData.title || "",
                department: positionData?.department.toString() || "",
                position: jobData.position?.toString() || "",
                description: jobData.description || "",
                location: jobData.location || "Porlamar",
                closing_date: jobData.closing_date || "",
                ask_education: jobData.ask_education || false,
            });
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(data: JobFormData) {
        setSaving(true);
        const toastId = toast.loading('Guardando cambios...');

        try {
            const { department, ...payload } = data;

            await apiClient.patch(`/api/ats/jobs/${params.id}/`, {
                ...payload,
                position: parseInt(data.position),
            });

            toast.success('Vacante actualizada exitosamente', { id: toastId });
            await loadData(); // Recargar los datos
        } catch (error: any) {
            let errorMessage = "Error al actualizar la vacante";

            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object' && data !== null) {
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
            }

            toast.error(errorMessage, { id: toastId });
        } finally {
            setSaving(false);
        }
    }

    async function publishJob() {
        setShowPublishDialog(false);
        setActionLoading(true);
        const toastId = toast.loading('Publicando vacante...');
        try {
            await apiClient.post(`/api/ats/jobs/${params.id}/publish/`);
            await loadData();
            toast.success('Vacante publicada exitosamente', { id: toastId });
        } catch (error: any) {
            let errorMessage = "Error al publicar la vacante";

            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object' && data !== null) {
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
            }

            toast.error(errorMessage, { id: toastId });
        } finally {
            setActionLoading(false);
        }
    }

    async function closeJob() {
        setShowCloseDialog(false);
        setActionLoading(true);
        const toastId = toast.loading('Cerrando vacante...');
        try {
            await apiClient.post(`/api/ats/jobs/${params.id}/close/`);
            await loadData();
            toast.success('Vacante cerrada exitosamente', { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Error al cerrar la vacante", { id: toastId });
        } finally {
            setActionLoading(false);
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
        { name: "Editar", href: "#" },
    ];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <h2 className="text-2xl font-bold">Vacante no encontrada</h2>
                <Button variant="outline" onClick={() => router.push("/admin/ats/jobs")}>
                    Volver al listado
                </Button>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            DRAFT: "secondary",
            PUBLISHED: "default",
            CLOSED: "destructive",
            FROZEN: "outline",
        };
        return (
            <Badge variant={variants[status] || "default"}>
                {JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS]}
            </Badge>
        );
    };

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{job.title}</h1>
                            {getStatusBadge(job.status)}
                        </div>
                        <p className="text-muted-foreground">Editar vacante</p>
                    </div>
                    <div className="flex gap-2">
                        {job.status === "DRAFT" && (
                            <Button onClick={() => setShowPublishDialog(true)} disabled={actionLoading}>
                                <Send className="mr-2 h-4 w-4" />
                                Publicar
                            </Button>
                        )}
                        {job.status === "PUBLISHED" && (
                            <Button variant="destructive" onClick={() => setShowCloseDialog(true)} disabled={actionLoading}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cerrar
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/ats/jobs/${job.id}/candidates`)}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Ver Candidatos ({job.candidates_count || 0})
                        </Button>
                    </div>
                </div>

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
                                    setValue("position", "");
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

                            {/* Objetivos y Requisitos */}
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
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.push("/admin/ats/jobs")}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>

            {/* AlertDialog para Publicar */}
            <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Publicar vacante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La vacante será visible para todos los candidatos en el portal público.
                            Asegúrate de que toda la información esté correcta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={publishJob}>Publicar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para Cerrar */}
            <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar vacante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La vacante ya no estará disponible para nuevas postulaciones.
                            Los candidatos existentes no se verán afectados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={closeJob} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Cerrar Vacante
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
