'use client';
import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';
import { useForm, FieldValues, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

import { FormFieldDef } from './CatalogManager';
// IMPORTAMOS EL COMPONENTE UNIFICADO
import { DynamicCombobox } from './DynamicCombobox';

// --- TIPOS ---

interface FormData extends FieldValues {
    id?: number;
    [key: string]: string | number | boolean | null | undefined;
}

interface CatalogFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    endpoint: string;
    fields: FormFieldDef[];
    initialData?: FormData;
    isEditing?: boolean;
    title: string;
}

// Misma interfaz de error que en PersonIdManager
interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

// --- UTILIDADES ---
const generateZodSchema = (fields: FormFieldDef[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    fields.forEach(field => {
        let fieldSchema: z.ZodTypeAny;

        if (field.type === 'number' || field.type === 'select') {
            fieldSchema = z.union([z.string(), z.number(), z.null(), z.undefined()])
                .transform((v) => {
                    if (v === '' || v === null || v === undefined) return null;
                    const num = Number(v);
                    return isNaN(num) ? null : num;
                });

            if (field.required) {
                fieldSchema = fieldSchema.refine((v) => v !== null, {
                    message: "Este campo es obligatorio.",
                });
            }
        }
        else {
            let baseStringSchema = z.string();
            if (field.label.toLowerCase().includes('nombre') || field.label.toLowerCase().includes('país')) {
                baseStringSchema = baseStringSchema.regex(/^[^0-9]*$/, {
                    message: "No se permiten números en este campo."
                });
            }

            if (field.required) {
                fieldSchema = baseStringSchema.min(1, "Este campo es obligatorio.");
            } else {
                fieldSchema = baseStringSchema.nullable().optional().or(z.literal(''));
            }
        }
        schemaFields[field.name] = fieldSchema;
    });

    return z.object(schemaFields);
};

// --- COMPONENTE PRINCIPAL ---

export function CatalogForm({
    isOpen,
    onClose,
    onSuccess,
    endpoint,
    fields,
    initialData,
    isEditing = false,
    title
}: CatalogFormProps) {

    const [serverError, setServerError] = useState<string | null>(null);

    const formSchema = useMemo(() => generateZodSchema(fields), [fields]);

    const defaultValues = useMemo(() => {
        const defaults: FormData = initialData ? { ...initialData } : {};
        fields.forEach(field => {
            if (field.type === 'select' && defaults[field.name] != null) {
                defaults[field.name] = String(defaults[field.name]);
            }
        });
        return defaults;
    }, [initialData, fields]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema) as Resolver<FormData>,
        defaultValues: defaultValues,
    });

    useEffect(() => {
        if (isOpen) {
            reset(defaultValues);
        }
    }, [isOpen, reset, defaultValues]);

    const handleCloseDialog = () => {
        setServerError(null);
        onClose();
    };

    // --- MANEJO DE ERRORES ESTANDARIZADO ---
    const handleServerError = (err: AxiosError<DjangoErrorResponse>) => {
        const responseData = err.response?.data;
        const status = err.response?.status;

        if (responseData && typeof responseData === 'object') {
            const rawString = JSON.stringify(responseData).toLowerCase();

            // 1. Detección de duplicados globales
            if (rawString.includes('conjunto único') || rawString.includes('unique set') || rawString.includes('must make a unique set')) {
                setServerError("Este registro ya existe (posible duplicado).");
                return;
            }

            const globalErrors: string[] = [];

            // 2. Distribución de errores
            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                // Verificamos si la clave coincide con algún campo del formulario
                const isField = fields.some(f => f.name === key);

                if (isField) {
                    // Error local (campo rojo)
                    setError(key, { type: 'server', message: errorText });
                } else {
                    // Error global (Alert)
                    if (key !== 'non_field_errors') {
                        globalErrors.push(`${key}: ${errorText}`);
                    } else {
                        globalErrors.push(errorText);
                    }
                }
            });

            if (globalErrors.length > 0) {
                setServerError(globalErrors.join('\n'));
            }

        } else {
            setServerError(`Ocurrió un problema de conexión o del servidor (${status || 'Desconocido'}).`);
        }
    };

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        try {
            if (isEditing && initialData?.id) {
                await apiClient.patch(`${endpoint}${initialData.id}/`, data);
            } else {
                await apiClient.post(endpoint, data);
            }
            onSuccess();
            handleCloseDialog();
        } catch (err) {
            if (err instanceof AxiosError) {
                handleServerError(err as AxiosError<DjangoErrorResponse>);
            } else {
                setServerError("Ocurrió un error inesperado.");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogContent className="sm:max-w-[550px] w-full">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">

                    {/* ALERT ROJO GLOBAL (Para errores no asociados a campos) */}
                    {serverError && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Atención</AlertTitle>
                            <AlertDescription className="whitespace-pre-wrap text-sm">
                                {serverError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {fields.map((field) => (
                        <div key={field.name} className="grid gap-1">
                            <Label
                                htmlFor={field.name}
                                className={errors[field.name] ? "text-destructive" : ""}
                            >
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                            </Label>

                            {field.type === 'select' ? (
                                <Controller
                                    name={field.name}
                                    control={control}
                                    render={({ field: controllerField }) => (
                                        <DynamicCombobox
                                            field={field}
                                            value={controllerField.value}
                                            onChange={controllerField.onChange}
                                            placeholder={field.helpText}
                                            hasError={!!errors[field.name]}
                                        />
                                    )}
                                />
                            ) : (
                                <Input
                                    id={field.name}
                                    type={field.type}
                                    placeholder={field.helpText}
                                    className={`${errors[field.name] ? "border-destructive focus-visible:ring-destructive" : ""} w-full`}
                                    {...register(field.name)}
                                />
                            )}

                            {/* FIX: Mensaje de error DEBAJO del input/select */}
                            {errors[field.name] && (
                                <span className="text-xs font-medium text-destructive mt-1 block">
                                    {errors[field.name]?.message?.toString()}
                                </span>
                            )}
                        </div>
                    ))}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}