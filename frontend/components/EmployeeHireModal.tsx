'use client';

import { useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// UI
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Custom
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { DatePicker } from "@/components/DatePicker";

// --- SCHEMAS ---
const hireSchema = z.object({
    person: z.string().min(1, "Debe seleccionar una persona."),
    position: z.string().min(1, "Debe seleccionar una posición."),
    role: z.string().min(1, "Seleccione el rol funcional."),
    employment_type: z.string().min(1, "Seleccione el tipo de contrato."),

    // CAMBIO CLAVE: Renombrado a current_status para coincidir con el backend
    current_status: z.string().min(1, "Seleccione el estatus inicial."),

    hire_date: z.date("La fecha de ingreso es obligatoria."),
    end_date: z.date().optional().nullable(),
}).refine(data => {
    if (data.end_date && data.hire_date && data.end_date <= data.hire_date) { return false; }
    return true;
}, { message: "La fecha de fin debe ser posterior a la de inicio.", path: ["end_date"] });

type HireFormData = z.infer<typeof hireSchema>;

interface EmployeeHireModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSuccess: () => void;
}

export function EmployeeHireModal({ isOpen, setIsOpen, onSuccess }: EmployeeHireModalProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<HireFormData>({
        resolver: zodResolver(hireSchema) as Resolver<HireFormData>,
        defaultValues: {
            person: "",
            position: "",
            employment_type: "",
            current_status: "", // Ajustado
            role: "",
            hire_date: undefined,
            end_date: null
        }
    });

    const { handleSubmit, control, formState: { errors }, reset, setError } = form;

    const onSubmit = async (data: HireFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            // Construimos el payload con los nombres exactos del modelo Django
            const payload = {
                person: Number(data.person),
                position: Number(data.position),
                role: Number(data.role),
                employment_type: Number(data.employment_type),
                current_status: Number(data.current_status), // Coincide con models.py
                hire_date: data.hire_date ? data.hire_date.toISOString().split('T')[0] : null,
                end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
            };

            // Endpoint correcto según tu nuevo urls.py
            await apiClient.post('/api/employment/employments/', payload);

            toast.success("Contrato creado exitosamente.");
            onSuccess();
            handleClose(false);

        } catch (err) {
            console.error(err);
            if (err instanceof AxiosError && err.response?.data) {
                const serverErrors = err.response.data;
                let globalMsg = "";

                // Manejo inteligente de errores del backend (incluyendo validación de vacantes)
                Object.keys(serverErrors).forEach((key) => {
                    const msg = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : String(serverErrors[key]);

                    // Si el error es de un campo del formulario, lo mostramos debajo del input
                    if (key in data) {
                        setError(key as keyof HireFormData, { type: 'server', message: msg });
                    }
                    // Errores globales (non_field_errors)
                    else if (key === 'non_field_errors' || key === 'detail') {
                        globalMsg = msg;
                    }
                });

                if (globalMsg) setServerError(globalMsg);
                else if (!Object.keys(serverErrors).some(k => k in data)) setServerError("Ocurrió un error inesperado al procesar la solicitud.");
            } else {
                setServerError("Error de conexión con el servidor.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            reset();
            setServerError(null);
        }
        setIsOpen(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Contratar Nuevo Empleado</DialogTitle></DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {serverError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{serverError}</AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader><CardTitle className="text-lg">Asignación de Puesto</CardTitle></CardHeader>
                        <CardContent className="grid gap-6">
                            {/* SELECCIÓN DE PERSONA */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className={cn(errors.person && "text-destructive")}>Persona <span className="text-destructive">*</span></Label>
                                    <Controller name="person" control={control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{
                                                name: 'person', label: 'Persona', type: 'select',
                                                // Asegúrate que tu core/views.py soporte este filtro ?has_id=true
                                                optionsEndpoint: '/api/core/persons/?has_id=true',
                                                optionsLabelKey: 'hiring_search'
                                            }}
                                            value={field.value} onChange={field.onChange} placeholder="Buscar por nombre..." hasError={!!errors.person}
                                        />
                                    )} />
                                    {errors.person && <span className="text-xs text-destructive mt-1">{errors.person.message}</span>}
                                </div>

                                {/* SELECCIÓN DE POSICIÓN */}
                                <div className="space-y-1">
                                    <Label className={cn(errors.position && "text-destructive")}>Posición / Cargo <span className="text-destructive">*</span></Label>
                                    <Controller name="position" control={control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'position', label: 'Posición', type: 'select', optionsEndpoint: '/api/organization/positions/', optionsLabelKey: 'full_name' }}
                                            value={field.value} onChange={field.onChange} placeholder="Buscar posición..." hasError={!!errors.position}
                                        />
                                    )} />
                                    {errors.position && <span className="text-xs text-destructive block mt-1">{errors.position.message}</span>}
                                </div>
                            </div>

                            {/* SELECCIÓN DE ROL FUNCIONAL */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className={cn(errors.role && "text-destructive")}>Rol Funcional <span className="text-destructive">*</span></Label>
                                    <Controller name="role" control={control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{
                                                name: 'role', label: 'Rol', type: 'select',
                                                optionsEndpoint: '/api/employment/roles/' // Ruta actualizada
                                            }}
                                            value={field.value} onChange={field.onChange} placeholder="Ej: Manager, Empleado..." hasError={!!errors.role}
                                        />
                                    )} />
                                    {errors.role && <span className="text-xs text-destructive mt-1">{errors.role.message}</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">Términos del Contrato</CardTitle></CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                {/* FECHA DE INGRESO */}
                                <div className="space-y-1">
                                    <Label className={cn(errors.hire_date && "text-destructive")}>Fecha de Ingreso <span className="text-destructive">*</span></Label>
                                    <Controller name="hire_date" control={control} render={({ field }) => (
                                        <DatePicker selected={field.value} onSelect={field.onChange} placeholder="Seleccionar fecha" className={cn(errors.hire_date && "border-destructive")} />
                                    )} />
                                    {errors.hire_date && <span className="text-xs text-destructive mt-1">{errors.hire_date.message}</span>}
                                </div>

                                {/* FECHA FIN */}
                                <div className="space-y-1">
                                    <Label>Fecha de Fin (Opcional)</Label>
                                    <Controller name="end_date" control={control} render={({ field }) => (
                                        <DatePicker selected={field.value || undefined} onSelect={field.onChange} placeholder="Indefinido" />
                                    )} />
                                    {errors.end_date && <span className="text-xs text-destructive mt-1">{errors.end_date.message}</span>}
                                </div>

                                {/* TIPO DE CONTRATO */}
                                <div className="space-y-1">
                                    <Label className={cn(errors.employment_type && "text-destructive")}>Tipo de Contrato <span className="text-destructive">*</span></Label>
                                    <Controller name="employment_type" control={control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{
                                                name: 'employment_type', label: 'Tipo Contrato', type: 'select',
                                                optionsEndpoint: '/api/employment/employment-types/' // Ruta actualizada
                                            }}
                                            value={field.value} onChange={field.onChange} placeholder="Seleccionar..." hasError={!!errors.employment_type}
                                        />
                                    )} />
                                    {errors.employment_type && <span className="text-xs text-destructive mt-1">{errors.employment_type.message}</span>}
                                </div>
                            </div>

                            {/* ESTATUS INICIAL */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className={cn(errors.current_status && "text-destructive")}>Estatus Inicial <span className="text-destructive">*</span></Label>
                                    <Controller name="current_status" control={control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{
                                                name: 'current_status', label: 'Estatus', type: 'select',
                                                optionsEndpoint: '/api/employment/employment-statuses/' // Ruta actualizada
                                            }}
                                            value={field.value} onChange={field.onChange} placeholder="Ej: Activo..." hasError={!!errors.current_status}
                                        />
                                    )} />
                                    {errors.current_status && <span className="text-xs text-destructive mt-1">{errors.current_status.message}</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Contratar Empleado
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}