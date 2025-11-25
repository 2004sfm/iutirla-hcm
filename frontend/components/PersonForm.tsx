'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { cn, parseBackendDate } from '@/lib/utils';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, ArrowLeft, User, FileBadge, Phone, MapPin, Users, Camera, X, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Custom Components
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { PersonIdManager } from "./PersonIdManager";
import { PersonContactManager } from "./PersonContactManager";
import { PersonAddressManager } from './PersonAddressManager';
import { PersonFamilyManager } from './PersonFamilyManager';
import { format } from 'date-fns';
import { DatePicker } from './DatePicker';
import { PersonLanguageManager } from './PersonLanguageManager';
import { PersonEducationManager } from './PersonEducationManager';
import { PersonCertificationManager } from './PersonCertification';

// ... (Tipos y Esquema igual) ...
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

const personSchema = z.object({
    first_name: z.string().min(2, "El primer nombre es obligatorio."),
    second_name: z.string().optional().nullable(),
    paternal_surname: z.string().min(2, "El apellido paterno es obligatorio."),
    maternal_surname: z.string().optional().nullable(),
    birthdate: z.date().optional().nullable(),
    gender: z.string().optional().nullable(),
    marital_status: z.string().optional().nullable(),
    salutation: z.string().optional().nullable(),
    country_of_birth: z.string().optional().nullable(),
});

type PersonFormData = z.infer<typeof personSchema>;

interface PersonFormProps {
    personId?: number;
    initialData?: PersonBackendData | null;
}

export function PersonForm({ personId, initialData }: PersonFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [avatarKey, setAvatarKey] = useState(0);

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoDeleted, setPhotoDeleted] = useState(false);

    const isEditMode = !!personId;

    const form = useForm<PersonFormData>({
        resolver: zodResolver(personSchema),
        defaultValues: {
            first_name: "",
            second_name: "",
            paternal_surname: "",
            maternal_surname: "",
            birthdate: undefined,
        }
    });

    useEffect(() => {
        if (initialData) {
            const formattedData: PersonFormData = {
                first_name: initialData.first_name,
                second_name: initialData.second_name,
                paternal_surname: initialData.paternal_surname,
                maternal_surname: initialData.maternal_surname,
                birthdate: parseBackendDate(initialData.birthdate),
                gender: initialData.gender ? String(initialData.gender) : null,
                marital_status: initialData.marital_status ? String(initialData.marital_status) : null,
                salutation: initialData.salutation ? String(initialData.salutation) : null,
                country_of_birth: initialData.country_of_birth ? String(initialData.country_of_birth) : null,
            };
            form.reset(formattedData);

            if (initialData.photo) {
                setPhotoPreview(initialData.photo);
                setPhotoDeleted(false);
            }
        }
    }, [initialData, form]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPhotoPreview(objectUrl);
            setPhotoDeleted(false);
        }
    };

    const handleClearPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPhotoFile(null);
        setPhotoPreview(null); // Esto debería hacer que AvatarFallback se muestre
        setPhotoDeleted(true);

        setAvatarKey(prevKey => prevKey + 1);

        // Esto es una buena práctica para asegurar que el input file se "reinicie"
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const { register, handleSubmit, control, formState: { errors } } = form;

    const onSubmit = async (data: PersonFormData) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            Object.entries(data).forEach(([key, value]) => {
                if (key === 'birthdate' && value instanceof Date) {
                    // Formateamos para enviar solo la fecha local
                    formData.append(key, format(value, "yyyy-MM-dd"));
                }
                else if (value !== null && value !== undefined && value !== "") {
                    formData.append(key, String(value));
                } else {
                    formData.append(key, "");
                }
            });

            if (photoFile) {
                formData.append('photo', photoFile);
            } else if (photoDeleted) {
                formData.append('photo', 'DELETE');
            }

            const config = { headers: { "Content-Type": null } };

            if (isEditMode) {
                await apiClient.patch(`/api/core/persons/${personId}/`, formData, config);
            } else {
                const response = await apiClient.post('/api/core/persons/', formData, config);
                const newId = response.data.id;
                router.push(`/admin/personnel/people/${newId}`);
            }

        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al guardar. Verifique los datos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... (Resto del renderizado igual) ...
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">
                        {isEditMode ? "Editar Expediente" : "Nuevo Registro"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isEditMode
                            ? "Gestione la información personal, documentos y contactos."
                            : "Complete la ficha básica para crear el expediente."
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={() => router.push('/admin/personnel/people')}>
                        <ArrowLeft className="size-4 mr-2" />
                        Volver
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-4">
                <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <TabsTrigger value="basic" className="gap-2"><User className="size-4" /> Básicos</TabsTrigger>
                    <TabsTrigger value="ids" disabled={!isEditMode} className="gap-2"><FileBadge className="size-4" /> Identidad</TabsTrigger>
                    <TabsTrigger value="contact" disabled={!isEditMode} className="gap-2"><Phone className="size-4" /> Contacto</TabsTrigger>
                    <TabsTrigger value="address" disabled={!isEditMode} className="gap-2"><MapPin className="size-4" /> Ubicación</TabsTrigger>
                    <TabsTrigger value="family" disabled={!isEditMode} className="gap-2"><Users className="size-4" /> Familia</TabsTrigger>
                    <TabsTrigger value="talent" disabled={!isEditMode} className="gap-2">
                        <GraduationCap className="size-4" /> Talento
                    </TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA 1: DATOS BÁSICOS --- */}
                <TabsContent value="basic">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Biográficos</CardTitle>
                            <CardDescription>Información esencial e imagen de perfil.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-8">

                            <div className="flex flex-col md:flex-row gap-4 justify-center">

                                {/* --- FOTO DE PERFIL CIRCULAR --- */}
                                <div className="flex flex-col items-center justify-between gap-2">
                                    <div className="flex items-center relative group">
                                        <Label
                                            htmlFor="photo-upload"
                                            className="cursor-pointer block relative size-28 rounded-full overflow-hidden border-4 border-muted hover:border-primary transition-all shadow-sm"
                                            title="Haz clic para subir una foto"
                                        >
                                            {/* ESTRUCTURA CORRECTA: Avatar > AvatarImage */}
                                            <Avatar key={avatarKey} className="w-full h-full">
                                                {photoPreview ? ( // Si photoPreview tiene un valor (una URL), muestra la imagen
                                                    <AvatarImage src={photoPreview} className="object-cover w-full h-full" />
                                                ) : ( // Si photoPreview es null, muestra el fallback
                                                    <AvatarFallback className="bg-muted flex items-center justify-center w-full h-full">
                                                        <Camera className="w-10 h-10 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>

                                            {/* Overlay Hover (Cámara) */}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </Label>

                                        {/* Botón X Flotante (Solo si hay foto) */}
                                        {photoPreview && (
                                            <button
                                                type="button"
                                                onClick={handleClearPhoto}
                                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md hover:bg-destructive/90 transition-transform hover:scale-110 z-20 flex items-center justify-center"
                                                title="Eliminar foto"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}

                                        <Input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Foto de Perfil</span>
                                </div>

                                {/* Campos de Texto */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                                    <div className="space-y-1">
                                        <Label className="text-sm">Primer Nombre <span className="text-destructive">*</span></Label>
                                        <Input
                                            {...register("first_name")}
                                            placeholder="Ej: Juan"
                                            className={cn("text-sm", errors.first_name && "border-destructive")}
                                        />
                                        {errors.first_name && <span className="text-xs text-destructive">{errors.first_name.message}</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Segundo Nombre</Label>
                                        <Input {...register("second_name")} placeholder="Ej: Carlos" className="text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Apellido Paterno <span className="text-destructive">*</span></Label>
                                        <Input
                                            {...register("paternal_surname")}
                                            placeholder="Ej: Pérez"
                                            className={cn("text-sm", errors.paternal_surname && "border-destructive")}
                                        />
                                        {errors.paternal_surname && <span className="text-xs text-destructive">{errors.paternal_surname.message}</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Apellido Materno</Label>
                                        <Input {...register("maternal_surname")} placeholder="Ej: González" className="text-sm" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Detalles Personales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-sm">Fecha de Nacimiento</Label>
                                    <Controller
                                        name="birthdate"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onSelect={field.onChange}
                                                placeholder="Seleccionar fecha"
                                            />
                                        )}
                                    />
                                    {errors.birthdate && <span className="text-xs text-destructive">{String(errors.birthdate.message)}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm">Género</Label>
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

                                <div className="space-y-1">
                                    <Label className="text-sm">Estado Civil</Label>
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
                                <div className="space-y-1">
                                    <Label className="text-sm">País de Nacimiento</Label>
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
                                <div className="space-y-1">
                                    <Label className="text-sm">Tratamiento (Saludo)</Label>
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

                            <div className="flex gap-2 justify-end pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                                    {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                                    {isEditMode ? "Guardar Cambios" : "Crear y Continuar"}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ids">
                    <Card>
                        <CardHeader><CardTitle>Documentos de Identidad</CardTitle><CardDescription>Cédulas, RIF y Pasaportes.</CardDescription></CardHeader>
                        <CardContent>
                            {personId ? <PersonIdManager personId={personId} /> : <p className="text-sm text-muted-foreground">Guarde primero.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contact">
                    <Card>
                        <CardHeader><CardTitle>Información de Contacto</CardTitle><CardDescription>Teléfonos y Correos.</CardDescription></CardHeader>
                        <CardContent>
                            {personId ? <PersonContactManager personId={personId} /> : <p className="text-sm text-muted-foreground">Guarde primero.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="address">
                    <Card>
                        <CardHeader><CardTitle>Direcciones Físicas</CardTitle><CardDescription>Residencia y Trabajo.</CardDescription></CardHeader>
                        <CardContent>
                            {personId ? <PersonAddressManager personId={personId} /> : <p className="text-sm text-muted-foreground">Guarde primero.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="family">
                    <Card>
                        <CardHeader><CardTitle>Cargas y Emergencias</CardTitle><CardDescription>Datos familiares.</CardDescription></CardHeader>
                        <CardContent>
                            {personId ? <PersonFamilyManager personId={personId} /> : <p className="text-sm text-muted-foreground">Guarde primero.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="talent">
                    <Card className="border-none shadow-none">
                        {/* No usamos CardHeader aquí porque cada Manager tiene su propio título */}
                        <CardContent className="p-0">

                            <div className="flex flex-col gap-8">
                                {personId ? (
                                    <>
                                        {/* 1. EDUCACIÓN FORMAL (Títulos Universitarios) */}
                                        <div className="space-y-2">
                                            <PersonEducationManager personId={personId} />
                                        </div>

                                        <Separator />

                                        {/* 2. CERTIFICACIONES Y CURSOS (La pieza nueva) */}
                                        <div className="space-y-2">
                                            <PersonCertificationManager personId={personId} />
                                        </div>

                                        <Separator />

                                        {/* 3. IDIOMAS */}
                                        <div className="space-y-2">
                                            <PersonLanguageManager personId={personId} />
                                        </div>
                                    </>
                                ) : (
                                    /* Estado vacío si se intenta acceder sin guardar primero */
                                    <div className="flex flex-col items-center justify-center h-48 bg-muted/10 rounded-lg border-2 border-dashed">
                                        <div className="bg-muted p-3 rounded-full mb-3">
                                            <GraduationCap className="size-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Guarde los datos básicos de la persona para habilitar la carga de currículum.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </form>
    );
}