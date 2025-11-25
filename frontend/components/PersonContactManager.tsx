'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, type Resolver, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';
import { cn } from "@/lib/utils";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Pencil, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Custom
import { DynamicCombobox } from "@/components/DynamicCombobox";
// Importamos el nuevo componente de diálogo
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";


// --- ESQUEMAS DE VALIDACIÓN / TIPOS ---

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

const phoneSchema = z.object({
    phone_type: z.string().min(1, "Seleccione el tipo."),
    area_code: z.string().min(1, "Seleccione el código de área."),
    subscriber_number: z.string()
        .min(7, "El número debe tener al menos 7 dígitos.")
        .regex(/^\d+$/, "Solo números."),
    is_primary: z.boolean(),
});

const emailSchema = z.object({
    email_type: z.string().min(1, "Seleccione el tipo."),
    email_address: z.string().min(1, "El correo es obligatorio.").email("Formato inválido."),
    is_primary: z.boolean(),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

interface PersonContactManagerProps { personId: number; }

// Interfaces de datos
interface PhoneItem {
    id: number;
    phone_type: number;
    phone_type_name: string;
    area_code: number;
    subscriber_number: string;
    full_number: string;
    is_primary: boolean;
}

interface EmailItem {
    id: number;
    email_type: number;
    email_type_name: string;
    email_address: string;
    is_primary: boolean;
}

// Tipo de retorno del formulario para Phone y Email
type PhoneFormReturn = UseFormReturn<PhoneFormData>;
type EmailFormReturn = UseFormReturn<EmailFormData>;


export function PersonContactManager({ personId }: PersonContactManagerProps) {
    const [phones, setPhones] = useState<PhoneItem[]>([]);
    const [emails, setEmails] = useState<EmailItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estados UI
    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
    const [editingPhoneId, setEditingPhoneId] = useState<number | null>(null);

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [editingEmailId, setEditingEmailId] = useState<number | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- NUEVOS ESTADOS PARA MANEJAR LA ELIMINACIÓN CENTRALIZADA ---
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'phone' | 'email'; id: number | null } | null>(null);


    // Forms
    const phoneForm = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone_type: "", area_code: "", subscriber_number: "", is_primary: false }
    });
    const { formState: { errors: phoneErrors } } = phoneForm;

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email_type: "", email_address: "", is_primary: false }
    });
    const { formState: { errors: emailErrors } } = emailForm;


    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [phonesRes, emailsRes] = await Promise.all([
                apiClient.get(`/api/core/person-phones/?person=${personId}`),
                apiClient.get(`/api/core/person-emails/?person=${personId}`)
            ]);
            setPhones(phonesRes.data.results || phonesRes.data);
            setEmails(emailsRes.data.results || emailsRes.data);
        } catch (err) {
            toast.error("Error al cargar datos de contacto.");
        } finally {
            setLoading(false);
        }
    }, [personId]);

    useEffect(() => { if (personId) fetchData(); }, [personId, fetchData]);

    // --- MANEJO DE ERRORES INTELIGENTE ---
    const handleServerError = (err: AxiosError<DjangoErrorResponse>, form: PhoneFormReturn | EmailFormReturn) => {
        const responseData = err.response?.data;
        // Obtener las claves del formulario actual para una verificación de tipo en tiempo de ejecución
        const formValues = form.getValues();

        if (responseData && typeof responseData === 'object') {
            const globalErrors: string[] = [];

            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                // Si el error es de 'is_primary' o email_address (duplicidad), va al Alert Global
                if (key === 'is_primary' || key === 'email_address' || key === 'non_field_errors') {
                    globalErrors.push(errorText);
                }
                // Si el campo existe en el formulario, lo asignamos.
                else if (key in formValues) {
                    // Eliminamos 'as any' tipando la clave dinámicamente
                    form.setError(key as keyof typeof formValues, { type: 'server', message: errorText });
                }
                // Errores no asignados
                else {
                    globalErrors.push(errorText);
                }
            });

            // Si hay errores globales, actualizamos el estado del Alert
            if (globalErrors.length > 0) {
                setServerError(globalErrors.join('\n'));
            }
        } else {
            setServerError("Ocurrió un error de conexión o del servidor.");
        }
    };

    // ==================== LOGICA TELÉFONOS (MODIFICADA) ====================

    const handlePhoneCreate = () => {
        setEditingPhoneId(null);
        setServerError(null);
        phoneForm.reset({ phone_type: "", area_code: "", subscriber_number: "", is_primary: false });
        setIsPhoneModalOpen(true);
    };

    const handlePhoneEdit = (item: PhoneItem) => {
        setEditingPhoneId(item.id);
        setServerError(null);
        phoneForm.reset({
            phone_type: String(item.phone_type),
            area_code: String(item.area_code),
            subscriber_number: item.subscriber_number,
            is_primary: item.is_primary
        });
        setIsPhoneModalOpen(true);
    };

    const onSubmitPhone = async (data: PhoneFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = { ...data, person: personId };
            if (editingPhoneId) {
                await apiClient.patch(`/api/core/person-phones/${editingPhoneId}/`, payload);
                toast.success("Teléfono actualizado exitosamente");
            } else {
                await apiClient.post('/api/core/person-phones/', payload);
                toast.success("Teléfono agregado exitosamente");
            }
            setIsPhoneModalOpen(false);
            fetchData();
        } catch (err) {
            if (err instanceof AxiosError) handleServerError(err, phoneForm);
            else setServerError("Error inesperado.");
        } finally { setIsSubmitting(false); }
    };

    // Función para disparar el diálogo de eliminación de teléfono
    const handleDeletePhone = (id: number) => {
        setItemToDelete({ type: 'phone', id });
        setIsDeleteAlertOpen(true);
    };

    // ==================== LOGICA EMAILS (MODIFICADA) ====================

    const handleEmailCreate = () => {
        setEditingEmailId(null);
        setServerError(null);
        emailForm.reset({ email_type: "", email_address: "", is_primary: false });
        setIsEmailModalOpen(true);
    };

    const handleEmailEdit = (item: EmailItem) => {
        setEditingEmailId(item.id);
        setServerError(null);
        emailForm.reset({
            email_type: String(item.email_type),
            email_address: item.email_address,
            is_primary: item.is_primary
        });
        setIsEmailModalOpen(true);
    };

    const onSubmitEmail = async (data: EmailFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = { ...data, person: personId };
            if (editingEmailId) {
                await apiClient.patch(`/api/core/person-emails/${editingEmailId}/`, payload);
                toast.success("Correo actualizado.");
            } else {
                await apiClient.post('/api/core/person-emails/', payload);
                toast.success("Correo agregado.");
            }
            setIsEmailModalOpen(false);
            fetchData();
        } catch (err) {
            if (err instanceof AxiosError) handleServerError(err, emailForm);
            else setServerError("Error inesperado.");
        } finally { setIsSubmitting(false); }
    };

    // Función para disparar el diálogo de eliminación de correo
    const handleDeleteEmail = (id: number) => {
        setItemToDelete({ type: 'email', id });
        setIsDeleteAlertOpen(true);
    };

    // --- FUNCIÓN UNIFICADA DE ELIMINACIÓN PARA EL DIÁLOGO ---
    const deleteItemAction = useCallback(async () => {
        if (!itemToDelete || !itemToDelete.id) {
            throw new Error("ID de elemento a eliminar no especificado.");
        }

        const endpoint = itemToDelete.type === 'phone'
            ? `/api/core/person-phones/${itemToDelete.id}/`
            : `/api/core/person-emails/${itemToDelete.id}/`;

        // La promesa debe lanzar un error si la API falla, para que el componente DeleteConfirmationDialog lo capture.
        await apiClient.delete(endpoint);
        fetchData(); // Recargar los datos después de la eliminación exitosa
    }, [itemToDelete, fetchData]);


    return (
        <div className="space-y-8">

            {/* --- TABLA TELÉFONOS --- */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2">Teléfonos</h3>
                    <Button size="sm" onClick={handlePhoneCreate}><Plus className="h-4 w-4 " /> Agregar</Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Número</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {phones.length === 0 ?
                                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin teléfonos.</TableCell></TableRow> :
                                phones.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-base">
                                            {item.full_number}
                                        </TableCell>
                                        <TableCell>
                                            {item.phone_type_name}
                                        </TableCell>
                                        <TableCell>
                                            {item.is_primary ? <Badge className="bg-chart-2 hover:bg-chart-2/90 text-[10px] w-24 justify-center"><Star className="h-3 w-3 mr-1 fill-current" /> PRINCIPAL</Badge> : <Badge variant="secondary" className="text-[10px] w-24 justify-center text-muted-foreground">SECUNDARIO</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePhoneEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDeletePhone(item.id)}><Trash2 className="h-4 w-4" /></Button>
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

            {/* --- TABLA EMAILS --- */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2">Correos Electrónicos</h3>
                    <Button size="sm" onClick={handleEmailCreate}><Plus className="h-4 w-4 " /> Agregar</Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Dirección</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {emails.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin correos.</TableCell></TableRow> :
                                emails.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.email_address}</TableCell>
                                        <TableCell>{item.email_type_name}</TableCell>
                                        <TableCell>
                                            {item.is_primary ? <Badge className="bg-chart-2 hover:bg-chart-2/90 text-[10px] w-24 justify-center"><Star className="h-3 w-3 mr-1 fill-current" /> PRINCIPAL</Badge> : <Badge variant="secondary" className="text-[10px] w-24 justify-center text-muted-foreground">SECUNDARIO</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEmailEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDeleteEmail(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ================= MODAL TELÉFONO ================= */}
            <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader><DialogTitle>{editingPhoneId ? "Editar Teléfono" : "Nuevo Teléfono"}</DialogTitle></DialogHeader>

                    <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4 py-2">

                        {/* ALERTA GLOBAL */}
                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap text-sm">{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1">
                            {/* CN: Etiqueta de Tipo de Teléfono */}
                            <Label className={cn(
                                "text-sm",
                                phoneErrors.phone_type && "text-destructive")}>
                                Tipo <span className="text-destructive">*</span>
                            </Label>

                            <Controller name="phone_type" control={phoneForm.control} render={({ field }) => (
                                <DynamicCombobox field={{ name: 'phone_type', label: 'Tipo', type: 'select', optionsEndpoint: '/api/core/phone-types/' }} value={field.value} onChange={field.onChange} placeholder="Móvil, Casa..." hasError={!!phoneErrors.phone_type} />
                            )} />
                            {/* Error DEBAJO */}
                            {phoneErrors.phone_type && <span className="text-xs font-medium text-destructive block mt-1">{phoneErrors.phone_type.message}</span>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3">
                            <div className="space-y-1">
                                {/* CN: Etiqueta de Código de Área */}
                                <Label className={cn(
                                    "text-sm",
                                    phoneErrors.area_code && "text-destructive")}>Código</Label>
                                <Controller name="area_code" control={phoneForm.control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'area_code', label: 'Código', type: 'select', optionsEndpoint: '/api/core/phone-area-codes/', optionsLabelKey: 'code' }} value={field.value} onChange={field.onChange} placeholder="0414" hasError={!!phoneErrors.area_code} />
                                )} />
                                {/* Error DEBAJO */}
                                {phoneErrors.area_code && <span className="text-xs font-medium text-destructive block mt-1">{phoneErrors.area_code.message}</span>}
                            </div>
                            <div className="space-y-1">
                                {/* CN: Etiqueta de Número de Suscriptor */}
                                <Label className={cn(
                                    "text-sm",
                                    phoneErrors.subscriber_number && "text-destructive")}>Número <span className="text-destructive">*</span></Label>

                                {/* CN: Input de Número de Suscriptor */}
                                <Input
                                    {...phoneForm.register("subscriber_number")}
                                    placeholder="1234567"
                                    className={cn(
                                        "w-full text-sm",
                                        phoneErrors.subscriber_number && "border-destructive"
                                    )}
                                />
                                {/* Error DEBAJO */}
                                {phoneErrors.subscriber_number && <span className="text-xs font-medium text-destructive block mt-1">{phoneErrors.subscriber_number.message}</span>}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded border">
                            <div className="flex items-center space-x-2 cursor-pointer">
                                <Switch id="phone-primary" checked={phoneForm.watch('is_primary')} onCheckedChange={(v) => phoneForm.setValue('is_primary', v)} />
                                <Label htmlFor="phone-primary" className="text-sm">Teléfono Principal</Label>
                            </div>
                        </div>

                        <DialogFooter><Button variant="ghost" onClick={() => setIsPhoneModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL EMAIL ================= */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader><DialogTitle>{editingEmailId ? "Editar Correo" : "Nuevo Correo"}</DialogTitle></DialogHeader>
                    <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4 py-2">

                        {serverError && <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Atención</AlertTitle><AlertDescription>{serverError}</AlertDescription></Alert>}

                        <div className="space-y-1">
                            {/* CN: Etiqueta de Tipo de Correo */}
                            <Label className={cn(emailErrors.email_type && "text-destructive")}>
                                Tipo <span className="text-destructive">*</span>
                            </Label>
                            <Controller name="email_type" control={emailForm.control} render={({ field }) => (
                                <DynamicCombobox field={{ name: 'email_type', label: 'Tipo', type: 'select', optionsEndpoint: '/api/core/email-types/' }} value={field.value} onChange={field.onChange} placeholder="Personal, Trabajo..." hasError={!!emailErrors.email_type} />
                            )} />
                            {/* Error DEBAJO */}
                            {emailErrors.email_type && <span className="text-xs font-medium text-destructive block mt-1">{emailErrors.email_type.message}</span>}
                        </div>

                        <div className="space-y-1">
                            {/* CN: Etiqueta de Dirección de Correo */}
                            <Label className={cn(emailErrors.email_address && "text-destructive")}>
                                Dirección de Correo <span className="text-destructive">*</span>
                            </Label>

                            {/* CN: Input de Dirección de Correo */}
                            <Input
                                {...emailForm.register("email_address")}
                                placeholder="usuario@ejemplo.com"
                                className={cn(
                                    "w-full text-sm",
                                    emailErrors.email_address && "border-destructive"
                                )}
                            />
                            {/* Error DEBAJO */}
                            {emailErrors.email_address && <span className="text-xs font-medium text-destructive block mt-1">{emailErrors.email_address.message}</span>}
                        </div>

                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded border">
                            <div className="flex items-center space-x-2">
                                <Switch id="email-primary" checked={emailForm.watch('is_primary')} onCheckedChange={(v) => emailForm.setValue('is_primary', v)} />
                                <Label htmlFor="email-primary" className="text-sm cursor-pointer">Correo Principal</Label>
                            </div>
                        </div>

                        <DialogFooter><Button variant="ghost" onClick={() => setIsEmailModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN REUTILIZABLE ================= */}
            <DeleteConfirmationDialog
                open={isDeleteAlertOpen}
                setOpen={setIsDeleteAlertOpen}
                onConfirmDelete={deleteItemAction}
                title={itemToDelete?.type === 'phone' ? "¿Eliminar Teléfono?" : "¿Eliminar Correo?"}
                description="Se eliminará este contacto permanentemente."
                successMessage="Contacto eliminado exitosamente."
            />
        </div>
    );
}