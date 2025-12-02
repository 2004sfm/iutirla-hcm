"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { parseBackendDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, FileText, Mail } from "lucide-react";

const fetcher = (url: string) => apiClient.get(url).then(res => res.data.results || res.data);

const employmentSchema = z.object({
    person: z.string().min(1, "La persona es requerida"),
    position: z.string().min(1, "La posición es requerida"),
    role: z.string().min(1, "El rol es requerido"),
    employment_type: z.string().min(1, "El tipo de empleo es requerido"),
    current_status: z.string().min(1, "El estatus es requerido"),
    hire_date: z.string().min(1, "La fecha de contratación es requerida"),
    end_date: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.employment_type !== "FIJ" && !data.end_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de finalización es requerida para este tipo de empleo",
            path: ["end_date"],
        });
    }
});

export type EmploymentFormData = z.infer<typeof employmentSchema>;

interface EmploymentFormProps {
    initialData?: any;
    isEditing?: boolean;
    employmentId?: string;
    onSuccess?: () => void;
}

export function EmploymentForm({ initialData, isEditing = false, employmentId, onSuccess }: EmploymentFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: persons } = useSWR("/api/core/persons/?page_size=1000", fetcher);
    const { data: departments } = useSWR("/api/organization/departments/?page_size=1000", fetcher);

    const [selectedDepartment, setSelectedDepartment] = useState<string>(initialData?.department?.toString() || "");

    const { data: positions } = useSWR(
        selectedDepartment
            ? `/api/organization/positions/?department=${selectedDepartment}&page_size=1000`
            : null,
        fetcher
    );

    // Prepare default values
    const defaultValues = {
        person: initialData?.person?.toString() || "",
        position: initialData?.position?.toString() || "",
        role: initialData?.role || "EMP",
        employment_type: initialData?.employment_type || "FIJ",
        current_status: initialData?.current_status || "ACT",
        hire_date: initialData?.hire_date || "",
        end_date: initialData?.end_date || null,
    };

    const { handleSubmit, formState: { errors }, setValue, watch, setError } = useForm<EmploymentFormData>({
        resolver: zodResolver(employmentSchema),
        defaultValues
    });

    const selectedPersonId = watch("person");

    // Fetch full person details when selected
    const { data: fullPerson } = useSWR(
        selectedPersonId ? `/api/core/persons/${selectedPersonId}/` : null,
        fetcher
    );

    // Use fullPerson for display if available, otherwise fallback to list item (though list item might be incomplete)
    const selectedPerson = fullPerson || persons?.find((p: any) => p.id.toString() === selectedPersonId);

    const onSubmit = async (data: EmploymentFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && employmentId) {
                await apiClient.patch(`/api/employment/employments/${employmentId}/`, data);
                toast.success("Empleado actualizado exitosamente");
            } else {
                await apiClient.post("/api/employment/employments/", data);
                toast.success("Empleado creado exitosamente");
                router.push("/admin/personnel/employees");
            }

            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Error submitting form:", error);
            if (error.response?.data) {
                const serverErrors = error.response.data;
                Object.keys(serverErrors).forEach((key) => {
                    if (key in defaultValues) {
                        setError(key as keyof EmploymentFormData, {
                            type: "server",
                            message: serverErrors[key][0] || serverErrors[key]
                        });
                    } else {
                        toast.error(`Error: ${serverErrors[key]}`);
                    }
                });
            } else {
                toast.error("Ocurrió un error al guardar el empleado");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? "Editar Empleado" : "Nuevo Empleado"}</CardTitle>
                    <CardDescription>{isEditing ? "Actualiza los datos del empleado" : "Registra un nuevo empleado"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="person" className={errors.person ? "text-destructive" : ""}>Persona *</Label>
                            <Combobox
                                options={persons?.map((p: any) => ({ value: p.id.toString(), label: p.hiring_search || p.full_name })) || []}
                                value={watch("person")}
                                onSelect={(value) => setValue("person", value)}
                                placeholder="Buscar por nombre o cédula..."
                                className={errors.person ? "border-destructive" : ""}
                                disabled={isEditing} // Usually person shouldn't change on edit
                            />
                            {errors.person && (
                                <p className="text-sm text-destructive">{errors.person.message}</p>
                            )}
                        </div>

                        {selectedPerson && (
                            <div className="md:col-span-2 mb-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <InfoRow label="Primer Nombre" value={selectedPerson.first_name} />
                                            <InfoRow label="Segundo Nombre" value={selectedPerson.second_name} />
                                            <InfoRow label="Apellido Paterno" value={selectedPerson.paternal_surname} />
                                            <InfoRow label="Apellido Materno" value={selectedPerson.maternal_surname} />
                                            <InfoRow label="Fecha de Nacimiento" value={selectedPerson.birthdate} />
                                            <InfoRow label="País de Nacimiento" value={selectedPerson.country_of_birth_name} />
                                            <InfoRow label="Género" value={selectedPerson.gender_name} />
                                            <InfoRow label="Estado Civil" value={selectedPerson.marital_status_name} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Departamento</Label>
                            <Combobox
                                options={departments?.map((d: any) => ({ value: d.id.toString(), label: d.name })) || []}
                                value={selectedDepartment}
                                onSelect={(value) => {
                                    setSelectedDepartment(value);
                                    setValue("position", ""); // Reset position when department changes
                                }}
                                placeholder="Filtrar por departamento..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position" className={errors.position ? "text-destructive" : ""}>Posición *</Label>
                            <Combobox
                                options={positions?.map((p: any) => ({ value: p.id.toString(), label: p.job_title_name || `Posición ${p.id}` })) || []}
                                value={watch("position")}
                                onSelect={(value) => setValue("position", value)}
                                placeholder="Seleccionar posición"
                                className={errors.position ? "border-destructive" : ""}
                            />
                            {errors.position && (
                                <p className="text-sm text-destructive">{errors.position.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className={errors.role ? "text-destructive" : ""}>Rol *</Label>
                            <Combobox
                                options={[
                                    { value: "EMP", label: "Empleado" },
                                    { value: "MGR", label: "Manager" }
                                ]}
                                value={watch("role")}
                                onSelect={(value) => setValue("role", value)}
                                placeholder="Seleccionar rol"
                                className={errors.role ? "border-destructive" : ""}
                            />
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="current_status" className={errors.current_status ? "text-destructive" : ""}>Estatus *</Label>
                            <Combobox
                                options={[
                                    { value: "ACT", label: "Activo" },
                                    { value: "SUS", label: "Suspendido" },
                                    { value: "PER", label: "De Permiso" },
                                    { value: "REP", label: "Reposo" },
                                    { value: "FIN", label: "Finalizado" },
                                    { value: "REN", label: "Renuncia" },
                                    { value: "DES", label: "Despido" },
                                    { value: "ANU", label: "Anulado" }
                                ]}
                                value={watch("current_status")}
                                onSelect={(value) => setValue("current_status", value)}
                                placeholder="Seleccionar estatus"
                                className={errors.current_status ? "border-destructive" : ""}
                            />
                            {errors.current_status && (
                                <p className="text-sm text-destructive">{errors.current_status.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employment_type" className={errors.employment_type ? "text-destructive" : ""}>Tipo de Empleo *</Label>
                            <Combobox
                                options={[
                                    { value: "FIJ", label: "Fijo" },
                                    { value: "TMP", label: "Temporal" },
                                    { value: "PAS", label: "Pasantía" }
                                ]}
                                value={watch("employment_type")}
                                onSelect={(value) => setValue("employment_type", value)}
                                placeholder="Seleccionar tipo"
                                className={errors.employment_type ? "border-destructive" : ""}
                            />
                            {errors.employment_type && (
                                <p className="text-sm text-destructive">{errors.employment_type.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Fecha de Contratación *</Label>
                            <DatePicker
                                value={parseBackendDate(watch("hire_date"))}
                                onChange={(date) => {
                                    setValue("hire_date", date ? format(date, "yyyy-MM-dd") : "");
                                }}
                            />
                            {errors.hire_date && (
                                <p className="text-sm text-destructive">{errors.hire_date.message}</p>
                            )}
                        </div>

                        {watch("employment_type") !== "FIJ" && (
                            <div className="space-y-2">
                                <Label className={errors.end_date ? "text-destructive" : ""}>Fecha de Finalización *</Label>
                                <DatePicker
                                    value={parseBackendDate(watch("end_date") || "")}
                                    onChange={(date) => {
                                        setValue("end_date", date ? format(date, "yyyy-MM-dd") : null);
                                    }}
                                />
                                {errors.end_date && (
                                    <p className="text-sm text-destructive">{errors.end_date.message}</p>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : (isEditing ? "Actualizar" : "Crear Empleado")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

function InfoRow({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="flex justify-between border-b pb-2 last:pb-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm text-right">{value || "-"}</span>
        </div>
    );
}
