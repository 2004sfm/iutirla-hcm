"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Mail,
    Phone,
    FileText,
    Calendar,
    User,
    Briefcase,
    MapPin,
    Download,
    UserCheck,
    Loader2
} from "lucide-react";
import { Candidate } from "@/types/ats";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

const stageColors = {
    NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    REV: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    INT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    OFF: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    HIRED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    REJ: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    POOL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

const roleOptions = [
    { value: "EMP", label: "Empleado" },
    { value: "MGR", label: "Manager" },
];

const employmentTypeOptions = [
    { value: "FIJ", label: "Fijo" },
    { value: "TMP", label: "Temporal" },
    { value: "PAS", label: "Pasantía" },
];

const employmentStatusOptions = [
    { value: "ACT", label: "Activo" },
];

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [showHireDialog, setShowHireDialog] = useState(false);
    const [hiring, setHiring] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [hireFormData, setHireFormData] = useState({
        hire_date: new Date().toISOString().split("T")[0],
        role: "EMP",
        employment_type: "FIJ",
        employment_status: "ACT",
        end_date: "",
        notes: "",
    });

    const { data: candidate, error, isLoading, mutate } = useSWR<Candidate>(
        id ? `/api/ats/candidates/${id}/` : null,
        fetcher
    );

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Validar fecha de inicio
        if (!hireFormData.hire_date) {
            newErrors.hire_date = "La fecha de inicio es obligatoria";
        } else {
            const hireDate = new Date(hireFormData.hire_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Permitir fecha pasada pero advertir si es muy antigua
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            if (hireDate < oneYearAgo) {
                newErrors.hire_date = "La fecha de inicio es muy antigua. Verifica que sea correcta";
            }
        }

        // Validar fecha de fin para contratos temporales y pasantías
        if (hireFormData.employment_type === "TMP" || hireFormData.employment_type === "PAS") {
            if (hireFormData.employment_type === "TMP" && !hireFormData.end_date) {
                newErrors.end_date = "La fecha de fin es obligatoria para contratos temporales";
            } else if (hireFormData.end_date) {
                const startDate = new Date(hireFormData.hire_date);
                const endDate = new Date(hireFormData.end_date);

                if (endDate <= startDate) {
                    newErrors.end_date = "La fecha de fin debe ser posterior a la fecha de inicio";
                }

                // Validar que no sea muy larga (más de 5 años para temporal)
                if (hireFormData.employment_type === "TMP") {
                    const diffYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
                    if (diffYears > 5) {
                        newErrors.end_date = "Los contratos temporales no deben exceder 5 años";
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleHire = async () => {
        // Validar formulario
        if (!validateForm()) {
            toast.error("Por favor corrige los errores del formulario");
            return;
        }

        setHiring(true);
        const toastId = toast.loading("Contratando candidato...");

        try {
            // Preparar datos - solo incluir end_date si está presente
            const dataToSend: any = {
                hire_date: hireFormData.hire_date,
                role: hireFormData.role,
                employment_type: hireFormData.employment_type,
                employment_status: hireFormData.employment_status,
                notes: hireFormData.notes,
            };

            // Solo agregar end_date si es temporal o pasantía y tiene valor
            if ((hireFormData.employment_type === "TMP" || hireFormData.employment_type === "PAS") && hireFormData.end_date) {
                dataToSend.end_date = hireFormData.end_date;
            }

            const response = await apiClient.post(`/api/ats/candidates/${id}/hire/`, dataToSend);

            toast.success("¡Candidato contratado exitosamente!", { id: toastId });
            setShowHireDialog(false);
            setErrors({});
            mutate(); // Refresh candidate data

            // Redirect to employee detail
            if (response.data.person_id) {
                setTimeout(() => {
                    router.push(`/admin/personnel/people/${response.data.person_id}`);
                }, 1500);
            }
        } catch (error: any) {
            console.error("Error hiring candidate:", error);
            const errorMsg = error.response?.data?.error || "Error al contratar candidato";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setHiring(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Cargando candidato...</p>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>No se pudo cargar el candidato</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/ats/candidates">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver a candidatos
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const canHire = candidate.stage === "OFF" || candidate.stage === "INT";

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/ats/candidates">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a candidatos
                    </Button>
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {candidate.avatar ? (
                            <img
                                src={candidate.avatar}
                                alt={`${candidate.first_name} ${candidate.last_name}`}
                                className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500 border-2 border-slate-200">
                                <span className="text-2xl font-bold">
                                    {candidate.first_name[0]}{candidate.last_name[0]}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {candidate.first_name} {candidate.last_name}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {candidate.job_posting_title || "Candidato"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className={stageColors[candidate.stage]}>
                            {candidate.stage_display}
                        </Badge>

                        {canHire && candidate.stage !== "HIRED" && (
                            <Button
                                onClick={() => {
                                    setShowHireDialog(true);
                                    setErrors({});
                                }}
                                className="bg-brand-primary hover:bg-brand-primary/90"
                            >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Contratar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Información de Contacto */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Información de Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{candidate.email}</p>
                            </div>
                        </div>

                        {candidate.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Teléfono</p>
                                    <p className="font-medium">{candidate.phone}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Cédula</p>
                                <p className="font-medium">{candidate.national_id}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Información de Postulación */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Información de Postulación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Vacante</p>
                                <p className="font-medium">{candidate.job_posting_title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Fecha de Aplicación</p>
                                <p className="font-medium">
                                    {new Date(candidate.created_at).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Curriculum Vitae */}
                {candidate.cv_file && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Curriculum Vitae
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <a
                                href={`http://localhost:8000${candidate.cv_file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                            >
                                <Button>
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar CV
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                )}

                {/* Educación */}
                {candidate.education && candidate.education.length > 0 && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Educación</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {candidate.education.map((edu, index) => (
                                    <div key={edu.id || index} className="border-l-2 border-brand-primary pl-4">
                                        <h4 className="font-semibold">{edu.level_name} - {edu.field_name}</h4>
                                        <p className="text-sm text-muted-foreground">{edu.school_name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(edu.start_date).getFullYear()}
                                            {edu.end_date && ` - ${new Date(edu.end_date).getFullYear()}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notas */}
                {candidate.notes && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{candidate.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Hire Dialog */}
            <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Contratar Candidato</DialogTitle>
                        <DialogDescription>
                            Completa los datos del contrato para {candidate.first_name} {candidate.last_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hire_date">Fecha de Inicio *</Label>
                                <Input
                                    id="hire_date"
                                    type="date"
                                    value={hireFormData.hire_date}
                                    onChange={(e) => {
                                        setHireFormData({ ...hireFormData, hire_date: e.target.value });
                                        setErrors({ ...errors, hire_date: "" });
                                    }}
                                    className={errors.hire_date ? "border-red-500" : ""}
                                />
                                {errors.hire_date && (
                                    <p className="text-sm text-red-600">{errors.hire_date}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Rol *</Label>
                                <Select
                                    value={hireFormData.role}
                                    onValueChange={(value) => setHireFormData({ ...hireFormData, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employment_type">Tipo de Contrato *</Label>
                            <Select
                                value={hireFormData.employment_type}
                                onValueChange={(value) => {
                                    setHireFormData({ ...hireFormData, employment_type: value, end_date: "" });
                                    setErrors({ ...errors, end_date: "" });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {employmentTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Show end_date only for temporary or internship */}
                        {(hireFormData.employment_type === "TMP" || hireFormData.employment_type === "PAS") && (
                            <div className="space-y-2">
                                <Label htmlFor="end_date">
                                    Fecha de Fin {hireFormData.employment_type === "TMP" ? "*" : "(Opcional)"}
                                </Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={hireFormData.end_date}
                                    onChange={(e) => {
                                        setHireFormData({ ...hireFormData, end_date: e.target.value });
                                        setErrors({ ...errors, end_date: "" });
                                    }}
                                    min={hireFormData.hire_date}
                                    className={errors.end_date ? "border-red-500" : ""}
                                />
                                {errors.end_date && (
                                    <p className="text-sm text-red-600">{errors.end_date}</p>
                                )}
                                {!errors.end_date && (
                                    <p className="text-xs text-muted-foreground">
                                        {hireFormData.employment_type === "TMP"
                                            ? "Los contratos temporales requieren una fecha de finalización"
                                            : "Opcional para pasantías"}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas (Opcional)</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                placeholder="Notas adicionales sobre el contrato..."
                                value={hireFormData.notes}
                                onChange={(e) => setHireFormData({ ...hireFormData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHireDialog(false)} disabled={hiring}>
                            Cancelar
                        </Button>
                        <Button onClick={handleHire} disabled={hiring} className="bg-brand-primary hover:bg-brand-primary/90">
                            {hiring ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Contratando...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Confirmar Contratación
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
