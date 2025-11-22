'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Pencil, AlertCircle, Users, HeartHandshake, Baby, Star, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Custom
import { DynamicCombobox } from "@/components/DynamicCombobox";

// --- TIPOS Y ESQUEMAS ---

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

// Esquema para Cargas Familiares (Dependent)
const dependentSchema = z.object({
    first_name: z.string().min(2, "Obligatorio."),
    second_name: z.string().optional().nullable(),
    paternal_surname: z.string().min(2, "Obligatorio."),
    maternal_surname: z.string().optional().nullable(),
    relationship: z.string().min(1, "Seleccione parentesco."),
    gender: z.string().optional().nullable(),
    birthdate: z.string().min(1, "La fecha es obligatoria."),
});
type DependentFormData = z.infer<typeof dependentSchema>;

// Esquema para Contactos de Emergencia (EmergencyContact)
const contactSchema = z.object({
    first_name: z.string().min(2, "Obligatorio."),
    second_name: z.string().optional().nullable(),
    paternal_surname: z.string().min(2, "Obligatorio."),
    maternal_surname: z.string().optional().nullable(),
    relationship: z.string().min(1, "Seleccione parentesco."),
    phone_area_code: z.string().min(1, "Seleccione el código."),
    phone_number: z.string().min(7, "El número debe tener al menos 7 dígitos."),
    is_primary: z.boolean(),
});
type ContactFormData = z.infer<typeof contactSchema>;

interface PersonFamilyManagerProps { personId: number; }

// Interfaces de datos (simples)
interface DependentItem { id: number; first_name: string; paternal_surname: string; relationship: number; birthdate: string;[key: string]: any; }
interface ContactItem { id: number; first_name: string; phone_number: string; is_primary: boolean;[key: string]: any; }


export function PersonFamilyManager({ personId }: PersonFamilyManagerProps) {
    const [dependents, setDependents] = useState<DependentItem[]>([]);
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estados Modales
    const [isDependentModalOpen, setIsDependentModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [editingDependentId, setEditingDependentId] = useState<number | null>(null);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms
    const dependentForm = useForm<DependentFormData>({ resolver: zodResolver(dependentSchema) });
    const contactForm = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [depRes, contactRes] = await Promise.all([
                apiClient.get(`/api/core/dependents/?person=${personId}`),
                apiClient.get(`/api/core/emergency-contacts/?person=${personId}`)
            ]);
            setDependents(depRes.data.results || depRes.data);
            setContacts(contactRes.data.results || contactRes.data);
        } catch (err) {
            toast.error("Error al cargar datos familiares.");
        } finally {
            setLoading(false);
        }
    }, [personId]);

    useEffect(() => { if (personId) fetchData(); }, [personId, fetchData]);

    // --- MANEJO DE ERRORES (Estandarizado) ---
    const handleServerError = (err: AxiosError<DjangoErrorResponse>, form: any) => {
        const responseData = err.response?.data;
        if (responseData && typeof responseData === 'object') {
            let globalErrors: string[] = [];
            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                if (key === 'is_primary' || key === 'non_field_errors') {
                    globalErrors.push(errorText);
                }
                else if (key in form.getValues()) {
                    form.setError(key, { type: 'server', message: errorText });
                }
                else {
                    globalErrors.push(errorText);
                }
            });
            if (globalErrors.length > 0) setServerError(globalErrors.join('\n'));
        } else {
            setServerError("Ocurrió un error de conexión o del servidor.");
        }
    };

    // ==================== LÓGICA DEPENDIENTES ====================

    const openDependentModal = (item?: DependentItem) => {
        setEditingDependentId(item?.id || null);
        setServerError(null);
        dependentForm.reset({
            first_name: item?.first_name || '',
            second_name: item?.second_name || null,
            paternal_surname: item?.paternal_surname || '',
            maternal_surname: item?.maternal_surname || null,
            relationship: item?.relationship ? String(item.relationship) : '',
            gender: item?.gender ? String(item.gender) : null,
            birthdate: item?.birthdate || '',
        });
        setIsDependentModalOpen(true);
    };

    const onSubmitDependent = async (data: DependentFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = { ...data, person: personId };
            if (editingDependentId) {
                await apiClient.patch(`/api/core/dependents/${editingDependentId}/`, payload);
                toast.success("Dependiente actualizado.");
            } else {
                await apiClient.post('/api/core/dependents/', payload);
                toast.success("Dependiente agregado.");
            }
            setIsDependentModalOpen(false);
            fetchData();
        } catch (err) {
            if (err instanceof AxiosError) handleServerError(err, dependentForm);
            else setServerError("Error inesperado.");
        } finally { setIsSubmitting(false); }
    };

    const deleteDependent = async (id: number) => {
        if (!confirm("¿Eliminar este dependiente?")) return;
        try { await apiClient.delete(`/api/core/dependents/${id}/`); fetchData(); }
        catch { toast.error("Error al eliminar."); }
    };

    // ==================== LÓGICA CONTACTOS ====================

    const openContactModal = (item?: ContactItem) => {
        setEditingContactId(item?.id || null);
        setServerError(null);
        contactForm.reset({
            first_name: item?.first_name || '',
            paternal_surname: item?.paternal_surname || '',
            // Aquí deberías mapear los datos para la edición si fueran más complejos.
            phone_area_code: item?.phone_area_code ? String(item.phone_area_code) : '',
            phone_number: item?.phone_number || '',
            is_primary: item?.is_primary || false,
            // Agrega otros campos si son necesarios para el reset
            relationship: item?.relationship ? String(item.relationship) : '',
            second_name: item?.second_name || null,
            maternal_surname: item?.maternal_surname || null,
        });
        setIsContactModalOpen(true);
    };

    const onSubmitContact = async (data: ContactFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = { ...data, person: personId };
            if (editingContactId) {
                await apiClient.patch(`/api/core/emergency-contacts/${editingContactId}/`, payload);
                toast.success("Contacto actualizado.");
            } else {
                await apiClient.post('/api/core/emergency-contacts/', payload);
                toast.success("Contacto agregado.");
            }
            setIsContactModalOpen(false);
            fetchData();
        } catch (err) {
            if (err instanceof AxiosError) handleServerError(err, contactForm);
            else setServerError("Error inesperado.");
        } finally { setIsSubmitting(false); }
    };

    const deleteContact = async (id: number) => {
        if (!confirm("¿Eliminar este contacto?")) return;
        try { await apiClient.delete(`/api/core/emergency-contacts/${id}/`); fetchData(); }
        catch { toast.error("Error al eliminar."); }
    };

    // --- RENDER ---
    return (
        <div className="space-y-8">

            {/* SECCIÓN 1: DEPENDIENTES (Cargas Familiares) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2"><Baby className="h-5 w-5 text-primary" /> Cargas Familiares</h3>
                    <Button size="sm" onClick={() => openDependentModal()}><Plus className="h-4 w-4 mr-2" /> Agregar Dependiente</Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Nombre Completo</TableHead>
                                <TableHead>Parentesco</TableHead>
                                <TableHead>Fecha Nac.</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dependents.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin dependientes registrados.</TableCell></TableRow> :
                                dependents.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.first_name} {item.paternal_surname}</TableCell>
                                        <TableCell>{item.relationship}</TableCell> {/* FIX: Usar relationship_name si el backend lo proporciona */}
                                        <TableCell>{item.birthdate}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDependentModal(item)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => deleteDependent(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Separator />

            {/* SECCIÓN 2: CONTACTOS DE EMERGENCIA */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-primary" /> Contactos de Emergencia</h3>
                    <Button size="sm" onClick={() => openContactModal()}><Plus className="h-4 w-4 mr-2" /> Agregar Contacto</Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Parentesco</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Sin contactos registrados.</TableCell></TableRow> :
                                contacts.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.first_name} {item.paternal_surname}</TableCell>
                                        <TableCell>{item.relationship}</TableCell> {/* FIX: Usar relationship_name */}
                                        <TableCell className="font-mono">{item.phone_number}</TableCell> {/* FIX: Usar full_phone */}
                                        <TableCell>
                                            {item.is_primary ? <Badge className="bg-chart-2 text-[10px] w-24 justify-center"><Star className="h-3 w-3 mr-1 fill-current" /> PRINCIPAL</Badge> : <Badge variant="secondary" className="text-[10px] w-24 justify-center">SECUNDARIO</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openContactModal(item)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => deleteContact(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ================= MODAL DEPENDIENTE ================= */}
            <Dialog open={isDependentModalOpen} onOpenChange={setIsDependentModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader><DialogTitle>{editingDependentId ? "Editar Dependiente" : "Nueva Carga Familiar"}</DialogTitle></DialogHeader>

                    <form onSubmit={dependentForm.handleSubmit(onSubmitDependent)} className="space-y-4 py-2">
                        {serverError && <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Atención</AlertTitle><AlertDescription>{serverError}</AlertDescription></Alert>}

                        <div className="grid grid-cols-2 gap-4">
                            {/* NOMBRES */}
                            <div className="space-y-1">
                                <Label className={dependentForm.formState.errors.first_name ? "text-destructive" : ""}>Nombre <span className="text-destructive">*</span></Label>
                                {dependentForm.formState.errors.first_name && <span className="text-xs font-medium text-destructive block mb-1">{dependentForm.formState.errors.first_name.message}</span>}
                                <Input {...dependentForm.register("first_name")} />
                            </div>
                            <div className="space-y-1">
                                <Label>Segundo Nombre</Label>
                                <Input {...dependentForm.register("second_name")} />
                            </div>
                            {/* APELLIDOS */}
                            <div className="space-y-1">
                                <Label className={dependentForm.formState.errors.paternal_surname ? "text-destructive" : ""}>Apellido Paterno <span className="text-destructive">*</span></Label>
                                {dependentForm.formState.errors.paternal_surname && <span className="text-xs font-medium text-destructive block mb-1">{dependentForm.formState.errors.paternal_surname.message}</span>}
                                <Input {...dependentForm.register("paternal_surname")} />
                            </div>
                            <div className="space-y-1">
                                <Label>Apellido Materno</Label>
                                <Input {...dependentForm.register("maternal_surname")} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {/* PARENTESCO */}
                            <div className="space-y-1">
                                <Label className={dependentForm.formState.errors.relationship ? "text-destructive" : ""}>Parentesco <span className="text-destructive">*</span></Label>
                                {dependentForm.formState.errors.relationship && <span className="text-xs font-medium text-destructive block mb-1">{dependentForm.formState.errors.relationship.message}</span>}
                                <Controller name="relationship" control={dependentForm.control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'relationship', label: 'Parentesco', type: 'select', optionsEndpoint: '/api/core/relationship-types/' }} value={field.value} onChange={field.onChange} placeholder="Hijo, Cónyuge..." hasError={!!dependentForm.formState.errors.relationship} />
                                )} />
                            </div>
                            {/* FECHA NAC */}
                            <div className="space-y-1">
                                <Label className={dependentForm.formState.errors.birthdate ? "text-destructive" : ""}>Nacimiento <span className="text-destructive">*</span></Label>
                                {dependentForm.formState.errors.birthdate && <span className="text-xs font-medium text-destructive block mb-1">{dependentForm.formState.errors.birthdate.message}</span>}
                                <Input type="date" {...dependentForm.register("birthdate")} />
                            </div>
                            {/* GÉNERO */}
                            <div className="space-y-1">
                                <Label>Género</Label>
                                <Controller name="gender" control={dependentForm.control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'gender', label: 'Género', type: 'select', optionsEndpoint: '/api/core/genders/' }} value={field.value} onChange={field.onChange} placeholder="F, M..." />
                                )} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDependentModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL CONTACTO DE EMERGENCIA ================= */}
            <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader><DialogTitle>{editingContactId ? "Editar Contacto" : "Nuevo Contacto de Emergencia"}</DialogTitle></DialogHeader>

                    <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4 py-2">
                        {serverError && <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Atención</AlertTitle><AlertDescription>{serverError}</AlertDescription></Alert>}

                        <div className="grid grid-cols-2 gap-4">
                            {/* NOMBRES */}
                            <div className="space-y-1">
                                <Label className={contactForm.formState.errors.first_name ? "text-destructive" : ""}>Nombre <span className="text-destructive">*</span></Label>
                                {contactForm.formState.errors.first_name && <span className="text-xs font-medium text-destructive block mb-1">{contactForm.formState.errors.first_name.message}</span>}
                                <Input {...contactForm.register("first_name")} />
                            </div>
                            <div className="space-y-1">
                                <Label>Segundo Nombre</Label>
                                <Input {...contactForm.register("second_name")} />
                            </div>
                            {/* APELLIDOS */}
                            <div className="space-y-1">
                                <Label className={contactForm.formState.errors.paternal_surname ? "text-destructive" : ""}>Apellido Paterno <span className="text-destructive">*</span></Label>
                                {contactForm.formState.errors.paternal_surname && <span className="text-xs font-medium text-destructive block mb-1">{contactForm.formState.errors.paternal_surname.message}</span>}
                                <Input {...contactForm.register("paternal_surname")} />
                            </div>
                            <div className="space-y-1">
                                <Label>Apellido Materno</Label>
                                <Input {...contactForm.register("maternal_surname")} />
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-3">
                            {/* PARENTESCO */}
                            <div className="space-y-1">
                                <Label className={contactForm.formState.errors.relationship ? "text-destructive" : ""}>Parentesco <span className="text-destructive">*</span></Label>
                                {contactForm.formState.errors.relationship && <span className="text-xs font-medium text-destructive block mb-1">{contactForm.formState.errors.relationship.message}</span>}
                                <Controller name="relationship" control={contactForm.control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'relationship', label: 'Parentesco', type: 'select', optionsEndpoint: '/api/core/relationship-types/' }} value={field.value} onChange={field.onChange} placeholder="Madre, Amigo..." hasError={!!contactForm.formState.errors.relationship} />
                                )} />
                            </div>
                            {/* CÓDIGO DE ÁREA */}
                            <div className="col-span-1 space-y-1">
                                <Label className={contactForm.formState.errors.phone_area_code ? "text-destructive" : ""}>Código <span className="text-destructive">*</span></Label>
                                {contactForm.formState.errors.phone_area_code && <span className="text-xs font-medium text-destructive block mb-1">{contactForm.formState.errors.phone_area_code.message}</span>}
                                <Controller name="phone_area_code" control={contactForm.control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'phone_area_code', label: 'Código', type: 'select', optionsEndpoint: '/api/core/phone-area-codes/', optionsLabelKey: 'code' }} value={field.value} onChange={field.onChange} placeholder="0414" hasError={!!contactForm.formState.errors.phone_area_code} />
                                )} />
                            </div>
                            {/* NÚMERO */}
                            <div className="col-span-1 space-y-1">
                                <Label className={contactForm.formState.errors.phone_number ? "text-destructive" : ""}>Número <span className="text-destructive">*</span></Label>
                                {contactForm.formState.errors.phone_number && <span className="text-xs font-medium text-destructive block mb-1">{contactForm.formState.errors.phone_number.message}</span>}
                                <Input {...contactForm.register("phone_number")} placeholder="1234567" className={`w-full ${contactForm.formState.errors.phone_number ? "border-destructive" : ""}`} />
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded border">
                            {contactForm.formState.errors.is_primary && <span className="text-xs font-medium text-destructive block mb-1 px-2">{contactForm.formState.errors.is_primary.message}</span>}
                            <div className="flex items-center space-x-2">
                                <Switch id="contact-primary" checked={contactForm.watch('is_primary')} onCheckedChange={(v) => contactForm.setValue('is_primary', v)} />
                                <Label htmlFor="contact-primary" className="text-sm cursor-pointer">Contacto Principal de Emergencia</Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsContactModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (editingContactId ? "Guardar Cambios" : "Guardar")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}