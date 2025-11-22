'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, ArrowLeft, User, FileBadge, Phone, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

// Custom Components
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { PersonIdManager } from "./PersonIdManager";
// FIX: Importamos el nuevo gestor de contacto
import { PersonContactManager } from "./PersonContactManager";
import { PersonAddressManager } from './PersonAddressManager';
import { PersonFamilyManager } from './PersonFamilyManager';

// --- TIPOS ---

// Interfaz exacta de lo que devuelve Django
export interface PersonBackendData {
    id?: number;
    first_name: string;
    second_name?: string | null;
    paternal_surname: string;
    maternal_surname?: string | null;
    birthdate?: string | null;
    gender?: number | null;
    marital_status?: number | null;
    salutation?: number | null;
    country_of_birth?: number | null;
    photo?: string | null;
    [key: string]: unknown;
}

// Esquema de Validación (Reglas de Negocio)
const personSchema = z.object({
    first_name: z.string().min(2, "El primer nombre es obligatorio."),
    second_name: z.string().optional().nullable(),
    paternal_surname: z.string().min(2, "El apellido paterno es obligatorio."),
    maternal_surname: z.string().optional().nullable(),
    // La fecha es opcional en creación, pero validamos formato si existe
    birthdate: z.string().optional().nullable().or(z.literal('')),
    // Los selects manejan strings en el frontend (IDs como texto)
    gender: z.string().optional().nullable(),
    marital_status: z.string().optional().nullable(),
    salutation: z.string().optional().nullable(),
    country_of_birth: z.string().optional().nullable(),
});

type PersonFormData = z.infer<typeof personSchema>;

interface PersonFormProps {
    personId?: number;      // Si existe, estamos editando
    initialData?: PersonBackendData | null;
}

export function PersonForm({ personId, initialData }: PersonFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    // Modo Edición: Si tenemos un ID, las pestañas extra están habilitadas
    const isEditMode = !!personId;

    const form = useForm<PersonFormData>({
        resolver: zodResolver(personSchema),
        defaultValues: {
            first_name: "",
            second_name: "",
            paternal_surname: "",
            maternal_surname: "",
            birthdate: "",
        }
    });

    // Cargar datos si estamos editando
    useEffect(() => {
        if (initialData) {
            const formattedData: PersonFormData = {
                first_name: initialData.first_name,
                second_name: initialData.second_name,
                paternal_surname: initialData.paternal_surname,
                maternal_surname: initialData.maternal_surname,
                birthdate: initialData.birthdate || "",
                // Convertimos IDs numéricos a String para los Combobox
                gender: initialData.gender ? String(initialData.gender) : null,
                marital_status: initialData.marital_status ? String(initialData.marital_status) : null,
                salutation: initialData.salutation ? String(initialData.salutation) : null,
                country_of_birth: initialData.country_of_birth ? String(initialData.country_of_birth) : null,
            };
            form.reset(formattedData);
        }
    }, [initialData, form]);

    const { register, handleSubmit, control, formState: { errors } } = form;

    const onSubmit = async (data: PersonFormData) => {
        setIsSubmitting(true);
        try {
            // Limpieza: Convertir "" a null para la API
            const payload = Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
            );

            if (isEditMode) {
                // PATCH (Actualizar)
                await apiClient.patch(`/api/core/persons/${personId}/`, payload);
                toast.success("Datos actualizados correctamente.");
            } else {
                // POST (Crear)
                const response = await apiClient.post('/api/core/persons/', payload);
                const newId = response.data.id;
                toast.success("Persona registrada. Ahora complete los detalles.");
                // Redirigir a modo edición para habilitar las otras pestañas
                router.push(`/admin/personnel/people/${newId}`);
            }

        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al guardar. Verifique los datos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Header del Formulario */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {isEditMode ? "Editar Expediente" : "Nuevo Registro"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEditMode
                            ? "Gestione la información personal, documentos y contactos."
                            : "Complete la ficha básica para crear el expediente."
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={() => router.push('/admin/personnel/people')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isEditMode ? "Guardar Cambios" : "Crear y Continuar"}
                    </Button>
                </div>
            </div>

            {/* Navegación por Pestañas */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[800px]">
                    <TabsTrigger value="basic" className="gap-2"><User className="h-4 w-4" /> Básicos</TabsTrigger>
                    <TabsTrigger value="ids" disabled={!isEditMode} className="gap-2"><FileBadge className="h-4 w-4" /> Identidad</TabsTrigger>
                    <TabsTrigger value="contact" disabled={!isEditMode} className="gap-2"><Phone className="h-4 w-4" /> Contacto</TabsTrigger>
                    <TabsTrigger value="address" disabled={!isEditMode} className="gap-2"><MapPin className="h-4 w-4" /> Ubicación</TabsTrigger>
                    <TabsTrigger value="family" disabled={!isEditMode} className="gap-2"><Users className="h-4 w-4" /> Familia</TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA 1: DATOS BÁSICOS --- */}
                <TabsContent value="basic" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Biográficos</CardTitle>
                            <CardDescription>Información esencial de la persona.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">

                            {/* Nombres y Apellidos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Primer Nombre <span className="text-destructive">*</span></Label>
                                    <Input {...register("first_name")} className={errors.first_name ? "border-destructive" : ""} placeholder="Ej: Juan" />
                                    {errors.first_name && <span className="text-xs text-destructive">{errors.first_name.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Segundo Nombre</Label>
                                    <Input {...register("second_name")} placeholder="Ej: Carlos" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido Paterno <span className="text-destructive">*</span></Label>
                                    <Input {...register("paternal_surname")} className={errors.paternal_surname ? "border-destructive" : ""} placeholder="Ej: Pérez" />
                                    {errors.paternal_surname && <span className="text-xs text-destructive">{errors.paternal_surname.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido Materno</Label>
                                    <Input {...register("maternal_surname")} placeholder="Ej: González" />
                                </div>
                            </div>

                            <Separator />

                            {/* Detalles Personales */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Fecha de Nacimiento</Label>
                                    <Input type="date" {...register("birthdate")} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Género</Label>
                                    <Controller
                                        name="gender"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicCombobox
                                                field={{ name: 'gender', label: 'Género', type: 'select', optionsEndpoint: '/api/core/genders/' }}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Seleccione..."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Estado Civil</Label>
                                    <Controller
                                        name="marital_status"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicCombobox
                                                field={{ name: 'marital_status', label: 'Estado Civil', type: 'select', optionsEndpoint: '/api/core/marital-statuses/' }}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Seleccione..."
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Origen y Trato */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>País de Nacimiento</Label>
                                    <Controller
                                        name="country_of_birth"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicCombobox
                                                field={{ name: 'country_of_birth', label: 'País', type: 'select', optionsEndpoint: '/api/core/countries/' }}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Buscar país..."
                                            />
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tratamiento (Saludo)</Label>
                                    <Controller
                                        name="salutation"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicCombobox
                                                field={{ name: 'salutation', label: 'Saludo', type: 'select', optionsEndpoint: '/api/core/salutations/' }}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sr./Sra./Dr..."
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PESTAÑA 2: IDENTIFICACIÓN --- */}
                <TabsContent value="ids" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos de Identidad</CardTitle>
                            <CardDescription>Cédulas, RIF y Pasaportes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {personId ? (
                                <PersonIdManager personId={personId} />
                            ) : (
                                <p className="text-sm text-muted-foreground">Debe guardar la persona antes de agregar documentos.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PESTAÑA 3: CONTACTO (NUEVA) --- */}
                <TabsContent value="contact" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>Gestione los números de teléfono y direcciones de correo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* FIX: Integración del Gestor de Contacto */}
                            {personId ? (
                                <PersonContactManager personId={personId} />
                            ) : (
                                <p className="text-sm text-muted-foreground">Debe guardar la persona antes de agregar contactos.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PLACEHOLDERS --- */}
                <TabsContent value="address" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>Gestione los números de teléfono y direcciones de correo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* FIX: Integración del Gestor de Contacto */}
                            {personId ? (
                                <PersonAddressManager personId={personId} />
                            ) : (
                                <p className="text-sm text-muted-foreground">Debe guardar la persona antes de agregar contactos.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="family" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>Gestione los números de teléfono y direcciones de correo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* FIX: Integración del Gestor de Contacto */}
                            {personId ? (
                                <PersonFamilyManager personId={personId} />
                            ) : (
                                <p className="text-sm text-muted-foreground">Debe guardar la persona antes de agregar contactos.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </form>
    );
}