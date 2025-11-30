'use client';
import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';
import { useForm, FieldValues, Controller, Resolver, useWatch, Control } from 'react-hook-form';
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
// --- IMPORTAMOS EL SWITCH ---
import { Switch } from "@/components/ui/switch";

import { FormFieldDef } from './CatalogManager';
import { DynamicCombobox } from './DynamicCombobox';
import { MultiSelectCombobox } from './MultiSelectCombobox';

// --- TIPOS ---

interface FormData extends FieldValues {
    id?: number;
    [key: string]: string | number | boolean | null | undefined;
}

interface CatalogFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (isEditing: boolean) => void;
    endpoint: string;
    fields: FormFieldDef[];
    initialData?: FormData;
    isEditing?: boolean;
    title: string;
}

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

        // CASO BOOLEAN (Switch)
        if (field.type === 'boolean') {
            // Zod boolean: permite true/false y por defecto false si no viene
            fieldSchema = z.boolean().default(false);
        }
        // CASO MULTISELECT (Array de strings/números)
        else if (field.type === 'multiselect') {
            fieldSchema = z.array(z.string()).default([]);

            if (field.required) {
                fieldSchema = fieldSchema.min(1, "Debe seleccionar al menos un elemento.");
            }
        }
        // CASO NUMBER / SELECT
        else if (field.type === 'number' || field.type === 'select') {
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
        // CASO TEXTO
        else {
            let baseStringSchema = z.string();

            // Validación para campos de nombre (catálogos): solo letras, números, espacios y tildes
            if (field.name === 'name' || field.label.toLowerCase().includes('nombre')) {
                baseStringSchema = baseStringSchema.regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]*$/, {
                    message: "Solo se permiten letras, números, espacios y tildes (sin signos especiales)."
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

// --- COMPONENTE INTERNO PARA SELECTS DEPENDIENTES ---
interface DependentComboboxProps {
    field: FormFieldDef;
    control: Control<FormData>;
    errors: any;
}

function DependentCombobox({ field, control, errors }: DependentComboboxProps) {
    // Estado para ignorar la dependencia (mostrar todos)
    const [ignoreDependency, setIgnoreDependency] = useState(false);

    // Si el campo tiene una dependencia, observamos su valor
    const dependencyValue = useWatch({
        control,
        name: field.dependsOn || '',
        defaultValue: null
    });

    // Construimos el endpoint dinámico
    const dynamicEndpoint = useMemo(() => {
        if (!field.optionsEndpoint) return '';

        if (field.dependsOn && !ignoreDependency) {
            // Si depende de algo, NO ignoramos la dependencia, y ese algo no tiene valor...
            if (!dependencyValue) return '';

            // Si tiene valor, lo agregamos como query param
            const separator = field.optionsEndpoint.includes('?') ? '&' : '?';
            return `${field.optionsEndpoint}${separator}${field.dependsOn}=${dependencyValue}`;
        }

        // Si no hay dependencia o la ignoramos, devolvemos el endpoint base (todos)
        return field.optionsEndpoint;
    }, [field.optionsEndpoint, field.dependsOn, dependencyValue, ignoreDependency]);

    return (
        <div className="space-y-2">
            <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                    <DynamicCombobox
                        field={{
                            ...field,
                            optionsEndpoint: dynamicEndpoint,
                            // Si ignoramos dependencia y existe una key alternativa, la usamos. Si no, la normal.
                            optionsLabelKey: (ignoreDependency && field.optionsLabelKeyOnIgnore)
                                ? field.optionsLabelKeyOnIgnore
                                : field.optionsLabelKey
                        }}
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        placeholder={field.helpText}
                        hasError={!!errors[field.name]}
                    />
                )}
            />

            {/* Toggle para ignorar dependencia */}
            {field.dependsOn && field.ignoreDependencyLabel && (
                <div className="flex items-center space-x-2">
                    <Switch
                        id={`${field.name}-ignore-dep`}
                        checked={ignoreDependency}
                        onCheckedChange={setIgnoreDependency}
                    />
                    <Label htmlFor={`${field.name}-ignore-dep`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                        {field.ignoreDependencyLabel}
                    </Label>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTE INTERNO PARA MULTI-SELECTS DEPENDIENTES ---
function DependentMultiSelect({ field, control, errors }: DependentComboboxProps) {
    // Estado para ignorar la dependencia (mostrar todos)
    const [ignoreDependency, setIgnoreDependency] = useState(false);

    // Si el campo tiene una dependencia, observamos su valor
    const dependencyValue = useWatch({
        control,
        name: field.dependsOn || '',
        defaultValue: null
    });

    // Construimos el endpoint dinámico
    const dynamicEndpoint = useMemo(() => {
        if (!field.optionsEndpoint) return '';

        if (field.dependsOn && !ignoreDependency) {
            // Si depende de algo, NO ignoramos la dependencia, y ese algo no tiene valor...
            if (!dependencyValue) return '';

            // Si tiene valor, lo agregamos como query param
            const separator = field.optionsEndpoint.includes('?') ? '&' : '?';
            return `${field.optionsEndpoint}${separator}${field.dependsOn}=${dependencyValue}`;
        }

        // Si no hay dependencia o la ignoramos, devolvemos el endpoint base (todos)
        return field.optionsEndpoint;
    }, [field.optionsEndpoint, field.dependsOn, dependencyValue, ignoreDependency]);

    return (
        <div className="space-y-2">
            <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                    <MultiSelectCombobox
                        field={{
                            ...field,
                            optionsEndpoint: dynamicEndpoint,
                            // Si ignoramos dependencia y existe una key alternativa, la usamos. Si no, la normal.
                            optionsLabelKey: (ignoreDependency && field.optionsLabelKeyOnIgnore)
                                ? field.optionsLabelKeyOnIgnore
                                : field.optionsLabelKey
                        }}
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        placeholder={field.helpText}
                        hasError={!!errors[field.name]}
                    />
                )}
            />

            {/* Toggle para ignorar dependencia */}
            {field.dependsOn && field.ignoreDependencyLabel && (
                <div className="flex items-center space-x-2">
                    <Switch
                        id={`${field.name}-ignore-dep`}
                        checked={ignoreDependency}
                        onCheckedChange={setIgnoreDependency}
                    />
                    <Label htmlFor={`${field.name}-ignore-dep`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                        {field.ignoreDependencyLabel}
                    </Label>
                </div>
            )}
        </div>
    );
}

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
            // Aseguramos que los booleanos tengan valor por defecto
            if (field.type === 'boolean' && defaults[field.name] === undefined) {
                defaults[field.name] = false;
            }
            // Si no hay initialData y el campo tiene defaultValue, lo usamos
            if (!initialData && field.defaultValue !== undefined && defaults[field.name] === undefined) {
                defaults[field.name] = field.defaultValue;
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

    const handleServerError = (err: AxiosError<DjangoErrorResponse>) => {
        // ... (Tu lógica de manejo de errores se mantiene igual) ...
        const responseData = err.response?.data;
        const status = err.response?.status;

        if (responseData && typeof responseData === 'object') {
            const rawString = JSON.stringify(responseData).toLowerCase();
            if (rawString.includes('conjunto único') || rawString.includes('unique set')) {
                setServerError("Este registro ya existe (posible duplicado).");
                return;
            }
            const globalErrors: string[] = [];
            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                const isField = fields.some(f => f.name === key);
                if (isField) setError(key, { type: 'server', message: errorText });
                else if (key !== 'non_field_errors') globalErrors.push(`${key}: ${errorText}`);
                else globalErrors.push(errorText);
            });
            if (globalErrors.length > 0) setServerError(globalErrors.join('\n'));
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
            onSuccess(isEditing);
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

                    {serverError && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Atención</AlertTitle>
                            <AlertDescription className="whitespace-pre-wrap text-sm">{serverError}</AlertDescription>
                        </Alert>
                    )}

                    {fields.map((field) => (
                        <div key={field.name} className="grid gap-1">

                            {/* RENDERIZADO CONDICIONAL SEGÚN TIPO */}

                            {field.type === 'boolean' ? (
                                // CASO BOOLEAN: Renderizado especial con Switch
                                <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label htmlFor={field.name} className="text-base">
                                            {field.label}
                                        </Label>
                                        {/* Descripción del campo si existe */}
                                        {field.helpText && (
                                            <p className="text-sm text-muted-foreground">
                                                {field.helpText}
                                            </p>
                                        )}
                                    </div>
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <Switch
                                                checked={value as boolean}
                                                onCheckedChange={onChange}
                                            />
                                        )}
                                    />
                                </div>
                            ) : (
                                // CASOS TEXT / SELECT / NUMBER
                                <>
                                    <Label
                                        htmlFor={field.name}
                                    >
                                        {field.label} {field.required && <span className="text-destructive">*</span>}
                                    </Label>

                                    {field.type === 'select' ? (
                                        <DependentCombobox
                                            field={field}
                                            control={control}
                                            errors={errors}
                                        />
                                    ) : field.type === 'multiselect' ? (
                                        <DependentMultiSelect
                                            field={field}
                                            control={control}
                                            errors={errors}
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
                                </>
                            )}

                            {/* Mensaje de error */}
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
