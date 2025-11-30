"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicCombobox } from "@/components/DynamicCombobox";

import { Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { CatalogHeader } from "@/components/CatalogHeader";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface CandidateData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    national_id: string;
    job_posting: number;
    job_posting_title?: string;
}

interface Position {
    id: number;
    title: string;
    job_title?: string; // El título de la vacante (job_title_name)
    department?: {
        id: number;
        name: string;
    } | number | string;
}

interface EmploymentType {
    id: number;
    name: string;
}

interface EmploymentStatus {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
}

export default function NewEmployeePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const candidateId = searchParams?.get("from_candidate");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [position, setPosition] = useState<Position | null>(null);

    // Manual hiring state
    const [selectedPersonId, setSelectedPersonId] = useState<string>("");
    const [personDetails, setPersonDetails] = useState<any | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
    const [selectedPositionId, setSelectedPositionId] = useState<string>("");

    // Form data
    const [formData, setFormData] = useState({
        hire_date: new Date().toISOString().split('T')[0], // Fecha actual
        end_date: "",
        employment_type: "",
        role: "",
        employment_status: "1", // Default to "Active"
    });

    // Options for select fields
    const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
    const [employmentStatuses, setEmploymentStatuses] = useState<EmploymentStatus[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    // Check if selected employment type requires end date
    const selectedEmploymentType = employmentTypes.find(t => t.id.toString() === formData.employment_type);
    const requiresEndDate = selectedEmploymentType?.name.toLowerCase().includes('temporal') ||
        selectedEmploymentType?.name.toLowerCase().includes('pasante') ||
        selectedEmploymentType?.name.toLowerCase().includes('determinado');

    useEffect(() => {
        loadFormOptions();

        if (candidateId) {
            loadCandidateData(candidateId);
        } else {
            setLoading(false);
        }
    }, [candidateId]);

    // Fetch person details when selectedPersonId changes
    useEffect(() => {
        if (selectedPersonId) {
            apiClient.get(`/api/core/persons/${selectedPersonId}/`)
                .then(res => setPersonDetails(res.data))
                .catch(err => {
                    console.error("Error loading person details:", err);
                    toast.error("Error al cargar datos de la persona");
                });
        } else {
            setPersonDetails(null);
        }
    }, [selectedPersonId]);

    async function loadFormOptions() {
        try {
            const [typesRes, statusesRes, rolesRes] = await Promise.all([
                apiClient.get("/api/employment/employment-types/"),
                apiClient.get("/api/employment/employment-statuses/"),
                apiClient.get("/api/employment/roles/"),
            ]);

            setEmploymentTypes(typesRes.data.results || typesRes.data || []);
            setEmploymentStatuses(statusesRes.data.results || statusesRes.data || []);
            setRoles(rolesRes.data.results || rolesRes.data || []);
        } catch (error) {
            console.error("Error loading form options:", error);
            toast.error("Error al cargar opciones del formulario");
        }
    }

    async function loadCandidateData(id: string) {
        try {
            const res = await apiClient.get(`/api/ats/candidates/${id}/`);
            setCandidate(res.data);

            // Load job posting and position details
            if (res.data.job_posting) {
                const jobRes = await apiClient.get(`/api/ats/jobs/${res.data.job_posting}/`);
                const jobData = jobRes.data;

                if (jobData.position) {
                    const posRes = await apiClient.get(`/api/organization/positions/${jobData.position}/`);
                    const positionData = posRes.data;

                    // If department is just an ID, fetch the full department data
                    if (positionData.department && typeof positionData.department === 'number') {
                        const deptRes = await apiClient.get(`/api/organization/departments/${positionData.department}/`);
                        positionData.department = deptRes.data;
                    }

                    // Store both job posting title and position with department
                    positionData.job_title = jobData.job_title_name || jobData.title;
                    setPosition(positionData);
                }
            }
        } catch (error) {
            console.error("Error loading candidate:", error);
            toast.error("Error al cargar datos del candidato");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload: any = {
                hire_date: formData.hire_date,
                employment_type: formData.employment_type,
                employment_status: formData.employment_status,
                role: formData.role,
            };

            // Add end_date only if required and provided
            if (requiresEndDate && formData.end_date) {
                payload.end_date = formData.end_date;
            }

            if (candidateId && candidate) {
                // Hiring from ATS - use hire endpoint
                await apiClient.post(`/api/ats/candidates/${candidate.id}/hire/`, payload);
                toast.success(`${candidate.first_name} ${candidate.last_name} ha sido contratado exitosamente`);
            } else {
                // Manual hiring
                if (!selectedPersonId || !selectedPositionId) {
                    toast.error("Debe seleccionar una persona y una posición");
                    setSubmitting(false);
                    return;
                }

                payload.person = selectedPersonId;
                payload.position = selectedPositionId;

                await apiClient.post('/api/employment/employments/', payload);
                toast.success("Contrato creado exitosamente");
            }

            router.push("/admin/personnel/employees");

        } catch (error: any) {
            console.error("Error hiring:", error);

            // Mejor manejo de errores
            if (error.response?.data) {
                const data = error.response.data;

                // Caso específico: Posición llena (viene en el campo 'position' o 'non_field_errors')
                if (data.position) {
                    toast.error(Array.isArray(data.position) ? data.position[0] : data.position);
                } else if (data.current_status) {
                    toast.error(Array.isArray(data.current_status) ? data.current_status[0] : data.current_status);
                } else if (data.detail) {
                    toast.error(data.detail);
                } else {
                    // Error genérico con detalles
                    const firstError = Object.values(data)[0];
                    toast.error(Array.isArray(firstError) ? firstError[0] : "Error al procesar la solicitud");
                }
            } else {
                toast.error("Error de conexión o del servidor");
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <CatalogHeader
                items={[
                    { name: "Personal", href: "/admin/personnel/employees" },
                    { name: "Empleados", href: "/admin/personnel/employees" },
                    { name: "Contratar nuevo", href: "" },
                ]}
            />

            <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                {candidate ? `Contratar a ${candidate.first_name} ${candidate.last_name}` : "Contratar nuevo empleado"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Candidate Info (Read-only) OR Person Selector */}
                                {candidate ? (
                                    <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                                        <h3 className="font-semibold text-sm">Información del Candidato</h3>
                                        <div className="grid gap-3 md:grid-cols-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Nombre completo:</span>
                                                <p className="font-medium">{candidate.first_name} {candidate.last_name}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Cédula:</span>
                                                <p className="font-medium">{candidate.national_id}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Email:</span>
                                                <p className="font-medium">{candidate.email}</p>
                                            </div>
                                            {candidate.phone && (
                                                <div>
                                                    <span className="text-muted-foreground">Teléfono:</span>
                                                    <p className="font-medium">{candidate.phone}</p>
                                                </div>
                                            )}
                                            {position && (
                                                <>
                                                    <div>
                                                        <span className="text-muted-foreground">Cargo:</span>
                                                        <p className="font-medium">{position.job_title || position.title}</p>
                                                    </div>
                                                    {position.department && typeof position.department === 'object' && (
                                                        <div>
                                                            <span className="text-muted-foreground">Departamento:</span>
                                                            <p className="font-medium">{position.department.name}</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Datos del Empleado</h3>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Persona *</Label>
                                                <DynamicCombobox
                                                    field={{
                                                        name: 'person',
                                                        label: 'Persona',
                                                        type: 'select',
                                                        optionsEndpoint: '/api/core/persons/',
                                                        optionsLabelKey: 'full_name'
                                                    }}
                                                    value={selectedPersonId}
                                                    onChange={(val) => setSelectedPersonId(val || "")}
                                                    placeholder="Buscar por nombre o cédula..."
                                                />
                                            </div>

                                            {/* Person Details Card */}
                                            {personDetails && (
                                                <div className="col-span-2 rounded-lg border bg-slate-50 p-4 space-y-3">
                                                    <h4 className="font-semibold text-sm">Detalles de la Persona</h4>
                                                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Nombre completo:</span>
                                                            <p className="font-medium">{personDetails.full_name}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Documento:</span>
                                                            <p className="font-medium">{personDetails.primary_document || "N/A"}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Email:</span>
                                                            <p className="font-medium">{personDetails.primary_email || "N/A"}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Teléfono:</span>
                                                            <p className="font-medium">{personDetails.primary_phone || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Departamento</Label>
                                                <DynamicCombobox
                                                    field={{
                                                        name: 'department',
                                                        label: 'Departamento',
                                                        type: 'select',
                                                        optionsEndpoint: '/api/organization/departments/',
                                                        optionsLabelKey: 'name'
                                                    }}
                                                    value={selectedDepartmentId}
                                                    onChange={(val) => {
                                                        setSelectedDepartmentId(val || "");
                                                        setSelectedPositionId(""); // Reset position when department changes
                                                    }}
                                                    placeholder="Filtrar por departamento..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Posición / Cargo *</Label>
                                                <DynamicCombobox
                                                    field={{
                                                        name: 'position',
                                                        label: 'Posición',
                                                        type: 'select',
                                                        optionsEndpoint: selectedDepartmentId
                                                            ? `/api/organization/positions/?department=${selectedDepartmentId}`
                                                            : '/api/organization/positions/',
                                                        optionsLabelKey: 'job_title_name'
                                                    }}
                                                    value={selectedPositionId}
                                                    onChange={(val) => setSelectedPositionId(val || "")}
                                                    placeholder="Buscar cargo..."
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedDepartmentId
                                                        ? "Mostrando cargos del departamento seleccionado."
                                                        : "Mostrando todos los cargos activos."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Contract Details */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Detalles del Contrato</h3>

                                    <div>
                                        <Label htmlFor="employment_type">Tipo de Contrato *</Label>
                                        <Select
                                            value={formData.employment_type}
                                            onValueChange={(value) => setFormData({ ...formData, employment_type: value, end_date: "" })}
                                            required
                                        >
                                            <SelectTrigger id="employment_type">
                                                <SelectValue placeholder="Selecciona tipo de contrato" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employmentTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            La fecha de inicio será hoy: {new Date().toLocaleDateString('es-VE')}
                                        </p>
                                    </div>

                                    {requiresEndDate && (
                                        <div>
                                            <Label htmlFor="end_date">Fecha Final del Contrato *</Label>
                                            <Input
                                                id="end_date"
                                                type="date"
                                                required={requiresEndDate}
                                                value={formData.end_date}
                                                min={formData.hire_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Requerido para contratos temporales o pasantías
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="role">Rol *</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                            required
                                        >
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Selecciona rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id.toString()}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={submitting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            !formData.employment_type ||
                                            !formData.role ||
                                            (requiresEndDate && !formData.end_date) ||
                                            (!candidateId && (!selectedPersonId || !selectedPositionId))
                                        }
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Contratando...
                                            </>
                                        ) : (
                                            "Confirmar Contratación"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
