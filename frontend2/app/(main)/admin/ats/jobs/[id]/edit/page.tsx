"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";

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
}

interface ValidationErrors {
    title?: string;
    description?: string;
    position?: string;
}

interface PositionWithVacancies extends Position {
    available_vacancies?: number;
    active_employees?: number;
}

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [formData, setFormData] = useState({
        title: "",
        department: "",
        position: "",
        description: "",
        location: "",
        published_date: undefined as Date | undefined,
        closing_date: undefined as Date | undefined,
        status: "DRAFT" as string,
        ask_education: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [posRes, depRes, jobRes] = await Promise.all([
                apiClient.get("/api/organization/positions/"),
                apiClient.get("/api/organization/departments/"),
                apiClient.get(`/api/ats/jobs/${jobId}/`),
            ]);
            const positionsData = posRes.data.results || posRes.data;
            const departmentsData = depRes.data.results || depRes.data;
            setPositions(positionsData);
            setDepartments(departmentsData);

            // Populate form data
            const job = jobRes.data;
            const positionId = job.position;

            // Find the position to get its department
            const foundPosition = positionsData.find((p: Position) => p.id === positionId);
            const departmentId = foundPosition?.department;

            setFormData({
                title: job.title || "",
                department: departmentId?.toString() || "",
                position: positionId?.toString() || "",
                description: job.description || "",
                location: job.location || "",
                published_date: job.published_date ? new Date(job.published_date) : undefined,
                closing_date: job.closing_date ? new Date(job.closing_date) : undefined,
                status: job.status || "DRAFT",
                ask_education: job.ask_education || false,
            });

            setLoadingData(false);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar datos");
            setLoadingData(false);
        }
    }

    // Validación en tiempo real del título
    const validateTitle = (value: string) => {
        if (!value) {
            return "El título es obligatorio";
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$/.test(value)) {
            return "El título solo puede contener letras y espacios";
        }
        if (value.length < 5) {
            return "El título debe tener al menos 5 caracteres";
        }
        return "";
    };

    // Validación en tiempo real de la descripción
    const validateDescription = (value: string) => {
        if (!value) {
            return "La descripción es obligatoria";
        }
        if (value.length < 50) {
            return "La descripción debe tener al menos 50 caracteres";
        }
        if (value.length > 1000) {
            return "La descripción no puede exceder 1000 caracteres";
        }
        return "";
    };

    const handleTitleChange = (value: string) => {
        setFormData({ ...formData, title: value });
        const error = validateTitle(value);
        setErrors({ ...errors, title: error });
    };

    const handleDescriptionChange = (value: string) => {
        setFormData({ ...formData, description: value });
        const error = validateDescription(value);
        setErrors({ ...errors, description: error });
    };

    const handlePositionChange = async (value: string | number) => {
        const positionId = value.toString();
        setFormData({ ...formData, position: positionId });

        // Calculate available vacancies
        const position = positions.find(p => p.id.toString() === positionId);
        if (position) {
            try {
                const res = await apiClient.get("/api/employment/employments/", {
                    params: { position: positionId, page_size: 1000 }
                });
                const activeEmployees = res.data.results?.filter((emp: any) =>
                    emp.current_status_name && emp.current_status_name.toLowerCase().includes("activo")
                ).length || 0;

                const availableVacancies = position.vacancies - activeEmployees;

                // Update position with calculated data
                const updatedPositions = positions.map(p =>
                    p.id === position.id
                        ? { ...p, available_vacancies: availableVacancies, active_employees: activeEmployees }
                        : p
                );
                setPositions(updatedPositions as Position[]);
            } catch (error) {
                console.error("Error calculating vacancies:", error);
            }
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validar todos los campos
        const titleError = validateTitle(formData.title);
        const descError = validateDescription(formData.description);

        if (titleError || descError) {
            setErrors({
                title: titleError,
                description: descError,
            });
            toast.error("Por favor corrige los errores del formulario");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Actualizando vacante...");

        try {
            const payload: any = {
                title: formData.title,
                position: parseInt(formData.position),
                description: formData.description,
                location: formData.location,
                status: formData.status,
                ask_education: formData.ask_education,
            };
            // Note: department is NOT sent to backend, it's only for frontend filtering

            // Add dates if provided (convert to YYYY-MM-DD format)
            if (formData.published_date) {
                payload.published_date = formData.published_date.toISOString().split('T')[0];
            }
            if (formData.closing_date) {
                payload.closing_date = formData.closing_date.toISOString().split('T')[0];
            }

            const res = await apiClient.put(`/api/ats/jobs/${jobId}/`, payload);

            toast.success("Vacante actualizada exitosamente", { id: toastId });
            router.push(`/admin/ats/jobs`);
        } catch (error: any) {
            let errorMessage = "Error al actualizar la vacante";
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === "object" && data !== null) {
                    const messages = Object.values(data).flat().map(String);
                    if (messages.length > 0) {
                        errorMessage = messages.join(" ");
                    }
                }
            }
            toast.error(errorMessage, { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    const filteredPositions = positions.filter((p) => {
        if (!formData.department) return false;
        return p.department?.toString() === formData.department;
    });

    const selectedPosition = positions.find((p) => p.id.toString() === formData.position);
    const isFormValid = !errors.title && !errors.description &&
        formData.title && formData.description && formData.position;

    if (loadingData) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/admin/ats/jobs">
                    <Button variant="ghost">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Vacantes
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mt-4">Editar Vacante</h1>
                <p className="text-muted-foreground">Actualizar la información de la vacante</p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título de la Vacante *</Label>
                            <Input
                                id="title"
                                placeholder="Ej: Desarrollador Full Stack Senior"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.title}
                                </div>
                            )}
                            {formData.title && !errors.title && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Título válido
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Departamento *</Label>
                                <Combobox
                                    options={departments.map((d) => ({
                                        value: d.id.toString(),
                                        label: d.name,
                                    }))}
                                    value={formData.department}
                                    onSelect={(value) => {
                                        setFormData({ ...formData, department: value.toString(), position: "" });
                                        setErrors({ ...errors, position: "" });
                                    }}
                                    placeholder="Selecciona un departamento"
                                    emptyText="No se encontraron departamentos"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Posición *</Label>
                                <Combobox
                                    options={filteredPositions.map((p) => ({
                                        value: p.id.toString(),
                                        label: p.job_title_name || p.name || `Posición #${p.id}`,
                                    }))}
                                    value={formData.position}
                                    onSelect={handlePositionChange}
                                    placeholder="Selecciona una posición"
                                    emptyText={
                                        formData.department
                                            ? "No hay posiciones en este departamento"
                                            : "Selecciona un departamento primero"
                                    }
                                />
                                {errors.position && (
                                    <div className="flex items-start gap-2 text-sm text-red-600">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{errors.position}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedPosition && !errors.position && (() => {
                            const pos = selectedPosition as PositionWithVacancies;
                            const available = pos.available_vacancies ?? 0;
                            const total = pos.vacancies;
                            const isFullyOccupied = available <= 0;

                            return (
                                <Card className={isFullyOccupied ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold">
                                                    {selectedPosition.job_title_name || selectedPosition.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedPosition.department_name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold ${isFullyOccupied ? 'text-red-600' : 'text-green-600'}`}>
                                                    {available}/{total}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Disponibles/Total</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })()}

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción *</Label>
                            <Textarea
                                id="description"
                                rows={6}
                                placeholder="Describe las responsabilidades y objetivos del puesto... (mínimo 50 caracteres)"
                                value={formData.description}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                className={errors.description ? "border-red-500" : ""}
                            />
                            <div className="flex items-center justify-between text-xs">
                                <div>
                                    {errors.description && (
                                        <div className="flex items-center gap-2 text-red-600">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.description}
                                        </div>
                                    )}
                                    {formData.description && !errors.description && (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Descripción válida
                                        </div>
                                    )}
                                </div>
                                <span className={`text-muted-foreground ${formData.description.length > 1000 ? 'text-red-600' : ''}`}>
                                    {formData.description.length}/1000 caracteres
                                </span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Fechas y Publicación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado de Publicación *</Label>
                            <Combobox
                                options={[
                                    { value: "DRAFT", label: "Borrador" },
                                    { value: "PUBLISHED", label: "Publicada" },
                                    { value: "FROZEN", label: "Congelada" },
                                ]}
                                value={formData.status}
                                onSelect={(value) => setFormData({ ...formData, status: value.toString() })}
                                placeholder="Selecciona el estado"
                                emptyText="No hay estados disponibles"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="published_date">Fecha de Publicación</Label>
                                <DatePicker
                                    value={formData.published_date}
                                    onChange={(date) => setFormData({ ...formData, published_date: date })}
                                    placeholder="dd/mm/aaaa"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="closing_date">Fecha de Cierre</Label>
                                <DatePicker
                                    value={formData.closing_date}
                                    onChange={(date) => setFormData({ ...formData, closing_date: date })}
                                    placeholder="dd/mm/aaaa"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label htmlFor="ask_education">Solicitar Educación</Label>
                                <p className="text-sm text-muted-foreground">
                                    Requerir historial académico del candidato
                                </p>
                            </div>
                            <Switch
                                id="ask_education"
                                checked={formData.ask_education}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, ask_education: checked })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={loading || !isFormValid}>
                        {loading ? (
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
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/ats/jobs")}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>
        </div>
    );
}
