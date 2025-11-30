'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
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
import { MultiSelectCombobox } from "@/components/MultiSelectCombobox";

import { Switch } from "@/components/ui/switch";
import { useState } from 'react';

const positionSchema = z.object({
    job_title: z.string().min(1, "El cargo es obligatorio."),
    department: z.string().min(1, "El departamento es obligatorio."),
    vacancies: z.number().min(1, "Debe haber al menos 1 vacante."),
    manager_positions: z.array(z.string()).default([]),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface PositionFormProps {
    positionId: number;
    initialData: {
        job_title: number;
        department: number;
        vacancies: number;
        manager_positions: number[];
        manager_positions_data?: Array<{ id: number; job_title_name: string | null; department_id: number | null; }>;
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
            manager_positions: initialData.manager_positions.map(id => String(id)),
        }
    });

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = form;

    const onSubmit = async (data: PositionFormData) => {
        try {
            await apiClient.patch(`/api/organization/positions/${positionId}/`, {
                ...data,
                job_title: parseInt(data.job_title),
                department: parseInt(data.department),
                manager_positions: data.manager_positions.map(id => parseInt(id)),
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
                    <Label className="text-sm">Jefes Inmediatos (Reporta a)</Label>
                    <Controller
                        name="manager_positions"
                        control={control}
                        render={({ field }) => {
                            // Watch department to filter managers
                            const selectedDepartment = useWatch({ control, name: 'department' });

                            // Initialize showAll based on whether ANY current manager is from a different department
                            const [showAll, setShowAll] = useState(() => {
                                if (initialData.manager_positions_data && initialData.manager_positions_data.length > 0) {
                                    // If ANY manager is from a different department, enable showAll
                                    return initialData.manager_positions_data.some(
                                        manager => String(manager.department_id) !== String(initialData.department)
                                    );
                                }
                                return false;
                            });

                            // Construct endpoint: exclude current position + filter by department (if selected and not showing all)
                            let endpoint = `/api/organization/positions/?exclude=${positionId}`;
                            if (selectedDepartment && !showAll) {
                                endpoint += `&department=${selectedDepartment}`;
                            }

                            return (
                                <div className="space-y-2">
                                    <MultiSelectCombobox
                                        field={{
                                            name: 'manager_positions',
                                            label: 'Jefes Inmediatos',
                                            type: 'multiselect',
                                            optionsEndpoint: endpoint,
                                            optionsLabelKey: showAll ? 'full_name' : 'job_title_name'
                                        }}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Seleccione las posiciones de los jefes..."
                                        hasError={!!errors.manager_positions}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="show-all-managers"
                                            checked={showAll}
                                            onCheckedChange={setShowAll}
                                        />
                                        <Label htmlFor="show-all-managers" className="text-xs font-normal text-muted-foreground cursor-pointer">
                                            Reporta a otro departamento
                                        </Label>
                                    </div>
                                </div>
                            );
                        }}
                    />
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
