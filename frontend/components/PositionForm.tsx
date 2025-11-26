'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DynamicCombobox } from "@/components/DynamicCombobox";

const positionSchema = z.object({
    job_title: z.string().min(1, "El cargo es obligatorio."),
    department: z.string().min(1, "El departamento es obligatorio."),
    vacancies: z.number().min(1, "Debe haber al menos 1 vacante."),
    manager_position: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface PositionFormProps {
    positionId: number;
    initialData: {
        job_title: number;
        department: number;
        vacancies: number;
        manager_position: number | null;
        name: string | null;
    };
    onUpdate?: () => void;
}

export function PositionForm({ positionId, initialData, onUpdate }: PositionFormProps) {
    const form = useForm<PositionFormData>({
        resolver: zodResolver(positionSchema),
        defaultValues: {
            job_title: String(initialData.job_title),
            department: String(initialData.department),
            vacancies: initialData.vacancies,
            manager_position: initialData.manager_position ? String(initialData.manager_position) : null,
            name: initialData.name,
        }
    });

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = form;

    const onSubmit = async (data: PositionFormData) => {
        try {
            await apiClient.patch(`/api/organization/positions/${positionId}/`, {
                ...data,
                job_title: parseInt(data.job_title),
                department: parseInt(data.department),
                manager_position: data.manager_position ? parseInt(data.manager_position) : null,
            });
            toast.success("Posición actualizada exitosamente");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al actualizar la posición.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("text-sm", errors.job_title && "text-destructive")}>
                        Título del Cargo <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                        name="job_title"
                        control={control}
                        render={({ field }) => (
                            <DynamicCombobox
                                field={{
                                    name: 'job_title',
                                    label: 'Cargo',
                                    type: 'select',
                                    optionsEndpoint: '/api/organization/job-titles/'
                                }}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Seleccione el cargo..."
                                hasError={!!errors.job_title}
                            />
                        )}
                    />
                    {errors.job_title && <span className="text-xs text-destructive">{errors.job_title.message}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={cn("text-sm", errors.department && "text-destructive")}>
                        Departamento <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                        name="department"
                        control={control}
                        render={({ field }) => (
                            <DynamicCombobox
                                field={{
                                    name: 'department',
                                    label: 'Departamento',
                                    type: 'select',
                                    optionsEndpoint: '/api/organization/departments/'
                                }}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Seleccione el departamento..."
                                hasError={!!errors.department}
                            />
                        )}
                    />
                    {errors.department && <span className="text-xs text-destructive">{errors.department.message}</span>}
                </div>

                <div className="space-y-2">
                    <Label className={cn("text-sm", errors.vacancies && "text-destructive")}>
                        Vacantes <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        {...register("vacancies", { valueAsNumber: true })}
                        type="number"
                        min="1"
                        placeholder="1"
                        className={cn("text-sm", errors.vacancies && "border-destructive")}
                    />
                    {errors.vacancies && <span className="text-xs text-destructive">{errors.vacancies.message}</span>}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm">Jefe Inmediato</Label>
                    <Controller
                        name="manager_position"
                        control={control}
                        render={({ field }) => (
                            <DynamicCombobox
                                field={{
                                    name: 'manager_position',
                                    label: 'Jefe',
                                    type: 'select',
                                    optionsEndpoint: `/api/organization/positions/?exclude=${positionId}`,
                                    optionsLabelKey: 'full_name'
                                }}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Seleccione la posición del jefe..."
                                hasError={!!errors.manager_position}
                            />
                        )}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Nombre Descriptivo (Opcional)</Label>
                    <Input
                        {...register("name")}
                        placeholder="Ej: Gerente de Finanzas (VE)"
                        className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                        Nombre personalizado para diferenciar posiciones con el mismo cargo
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                    Guardar Cambios
                </Button>
            </div>
        </form>
    );
}
