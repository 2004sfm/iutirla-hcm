'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { cn, parseBackendDate } from '@/lib/utils';
import { AxiosError } from 'axios';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Ban, Crown, GitFork, History, LogOut } from "lucide-react"; // Icono

// UI Components
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Loader2, Save, ArrowLeft, UserCheck, Briefcase,
    CalendarIcon, Lock, AlertCircle, UserPlus, Pen, KeyRound,
    IdCard, User // <--- Agregados
} from "lucide-react";

// Notifications
import { toast } from "sonner";

// Custom Components
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { DatePicker } from "@/components/DatePicker";
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

// --- 1. ESQUEMAS DE VALIDACIÓN ---

const employmentSchema = z.object({
    position: z.string().min(1, "Debe seleccionar una posición."),
    employment_type: z.string().min(1, "Seleccione el tipo de contrato."),
    current_status: z.string().min(1, "Seleccione el estatus."),
    role: z.string().min(1, "Seleccione el rol."),
    hire_date: z.date({ required_error: "Fecha de ingreso requerida." }),
    end_date: z.date().optional().nullable(),
}).refine(data => {
    if (data.end_date && data.hire_date && data.end_date <= data.hire_date) { return false; }
    return true;
}, { message: "La fecha de fin debe ser posterior a la de inicio.", path: ["end_date"] });

const userCreationSchema = z.object({
    username: z.string().min(3, "Mínimo 3 caracteres"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm_password: z.string().min(6, "Confirme la contraseña"),
}).refine((data) => data.password === data.confirm_password, {
    message: "Las contraseñas no coinciden", path: ["confirm_password"],
});

const userEditSchema = z.object({
    username: z.string().min(3, "Mínimo 3 caracteres"),
    is_active: z.boolean().default(true),
    is_staff: z.boolean().default(false)
});

const passwordResetSchema = z.object({
    new_password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm_password: z.string().min(6)
}).refine(data => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden", path: ["confirm_password"]
});

type EmploymentFormData = z.infer<typeof employmentSchema>;
type UserCreationData = z.infer<typeof userCreationSchema>;

interface EmployeeFormProps {
    employmentId: number;
    initialData: any;
}

export function EmployeeForm({ employmentId, initialData }: EmployeeFormProps) {
    const router = useRouter();

    // Estados
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estados de Usuario
    const [hasUser, setHasUser] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Estados de Modales
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [userServerError, setUserServerError] = useState<string | null>(null);

    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);

    // --- FORMULARIOS ---
    const form = useForm<EmploymentFormData>({
        resolver: zodResolver(employmentSchema),
        defaultValues: {
            position: "", employment_type: "", current_status: "", role: "",
            hire_date: undefined, end_date: null
        }
    });

    const userForm = useForm<UserCreationData>({
        resolver: zodResolver(userCreationSchema),
        defaultValues: { username: "", password: "", confirm_password: "" }
    });

    const editUserForm = useForm({
        resolver: zodResolver(userEditSchema),
        defaultValues: { username: "", is_active: true, is_staff: false }
    });

    const passwordForm = useForm({
        resolver: zodResolver(passwordResetSchema),
        defaultValues: { new_password: "", confirm_password: "" }
    });

    // --- CARGA DE DATOS INICIALES ---
    useEffect(() => {
        if (initialData) {

            form.reset({
                position: String(initialData.position),
                employment_type: String(initialData.employment_type),
                current_status: String(initialData.current_status),
                role: String(initialData.role),
                hire_date: parseBackendDate(initialData.hire_date),
                end_date: parseBackendDate(initialData.end_date),
            });

            const userExists =
                initialData.has_user_account ||
                (initialData.user_account_details && initialData.user_account_details.id);

            setHasUser(!!userExists);

            if (initialData.user_account_details) {
                setUserData(initialData.user_account_details);
                editUserForm.reset({
                    username: initialData.user_account_details.username,
                    is_active: initialData.user_account_details.is_active,
                    is_staff: initialData.user_account_details.is_staff
                });
            }
        }
    }, [initialData, form, editUserForm]);

    // --- HELPER DE ERRORES ---
    const handleError = (err: any, setGlobalError: any, setErrorFn: any) => {
        if (err instanceof AxiosError && err.response?.data) {
            const serverErrors = err.response.data;
            let globalMsg = "";
            Object.keys(serverErrors).forEach((key) => {
                const msg = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : String(serverErrors[key]);
                try { setErrorFn(key as any, { type: 'server', message: msg }); }
                catch { globalMsg = msg; }
                if (key === 'non_field_errors' || key === 'detail') globalMsg = msg;
            });
            if (globalMsg) setGlobalError(globalMsg);
        } else {
            setGlobalError("Error de conexión con el servidor.");
        }
    };

    // --- SUBMIT 1: ACTUALIZAR EMPLEO ---
    const onSubmit = async (data: EmploymentFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const payload = {
                ...data,
                position: Number(data.position),
                employment_type: Number(data.employment_type),
                current_status: Number(data.current_status),
                role: Number(data.role),
                hire_date: data.hire_date ? data.hire_date.toISOString().split('T')[0] : null,
                end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
            };

            await apiClient.patch(`/api/employment/employments/${employmentId}/`, payload);
            toast.success("Expediente actualizado correctamente.");

            // ELIMINADO: router.refresh(); -> Esto causaba el parpadeo o pérdida del toast
            // Los datos en el formulario ya están actualizados visualmente.

        } catch (err) {
            handleError(err, setServerError, form.setError);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- SUBMIT 2: CREAR USUARIO ---
    const onCreateUser = async (data: UserCreationData) => {
        // Prevenir sumisión doble accidental
        if (isCreatingUser) return;

        setIsCreatingUser(true);
        setUserServerError(null);

        try {
            const personId = typeof initialData.person === 'object' ? initialData.person.id : initialData.person;
            if (!personId) throw new Error("No se pudo identificar a la persona.");

            const payload = {
                username: data.username,
                password: data.password,
                confirm_password: data.confirm_password,
                person_id: personId
            };

            const res = await apiClient.post('/api/accounts/users/', payload);

            // 1. Cerrar Modal
            setIsUserModalOpen(false);

            // 2. Actualizar Estado Local
            setHasUser(true);
            setUserData(res.data);
            editUserForm.reset({ username: data.username, is_active: true });

            // 3. Limpiar formulario
            userForm.reset();

            // 4. Mostrar Notificación
            toast.success("Usuario de sistema creado exitosamente.");

            // ELIMINADO: router.refresh(); -> No es necesario y limpia el estado local

        } catch (err) {
            handleError(err, setUserServerError, userForm.setError);
        } finally {
            setIsCreatingUser(false);
        }
    };

    // --- SUBMIT 3: ACTUALIZAR USERNAME/ESTATUS ---
    const onUpdateUser = async (data: any) => {
        try {
            if (!userData?.id) return;
            await apiClient.patch(`/api/accounts/users/${userData.id}/`, data);

            setUserData({ ...userData, ...data });
            setIsManageModalOpen(false);
            toast.success("Datos de usuario actualizados.");
        } catch (error) {
            toast.error("Error al actualizar usuario.");
        }
    };

    // --- SUBMIT 4: CAMBIAR CONTRASEÑA ---
    const onResetPassword = async (data: any) => {
        try {
            if (!userData?.id) return;
            await apiClient.patch(`/api/accounts/users/${userData.id}/`, {
                password: data.new_password
            });

            passwordForm.reset();
            setIsManageModalOpen(false);
            toast.success("Contraseña restablecida correctamente.");
        } catch (error) {
            toast.error("Error al cambiar la contraseña.");
        }
    };
    const terminateForm = useForm({
        defaultValues: {
            end_date: new Date(),
            exit_reason: "", // Antes era status_id
            exit_notes: "",  // Nuevo
            deactivate_user: true
        }
    });

    // Función de Envío de Terminación
    // Función de Envío de Terminación
    const onTerminate = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Payload actualizado para la "Opción 3" (Racional)
            const payload = {
                end_date: format(data.end_date, "yyyy-MM-dd"), // Formato correcto
                exit_reason: data.exit_reason, // Ej: 'REN', 'DES' (Antes era status_id)
                exit_notes: data.exit_notes,   // Texto libre
                deactivate_user: data.deactivate_user
            };

            await apiClient.post(`/api/employment/employments/${employmentId}/terminate/`, payload);

            toast.success("Relación laboral finalizada correctamente.");
            setIsTerminateModalOpen(false);
            router.refresh();

        } catch (err) {
            // Mejor manejo de error para ver qué dice el servidor
            if (err instanceof AxiosError && err.response?.data?.error) {
                toast.error(err.response.data.error);
            } else {
                toast.error("Error al procesar la salida.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Expediente Laboral</h2>


                </div>

                <div className="flex gap-2">

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsTerminateModalOpen(true)}
                    >
                        <Ban className="mr-2 h-4 w-4" />
                        Finalizar Contrato
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => router.push('/admin/personnel/employees')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                </div>

            </div>

            {serverError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{serverError}</AlertDescription></Alert>}

            <div className="grid lg:grid-cols-3 gap-6">

                {/* --- FORMULARIO PRINCIPAL --- */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Detalle del Cargo</CardTitle>
                                <CardDescription>Posición y ubicación en la estructura organizativa.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label className={cn(form.formState.errors.position && "text-destructive")}>Posición Actual <span className="text-destructive">*</span></Label>
                                    <Controller name="position" control={form.control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'position', label: 'Posición', type: 'select', optionsEndpoint: '/api/organization/positions/', optionsLabelKey: 'full_name' }}
                                            value={field.value} onChange={field.onChange} placeholder="Buscar posición..." hasError={!!form.formState.errors.position}
                                        />
                                    )} />
                                    {form.formState.errors.position && <span className="text-xs text-destructive mt-1 block">{form.formState.errors.position.message}</span>}
                                </div>
                                <div className="space-y-1">
                                    <Label className={cn(form.formState.errors.role && "text-destructive")}>Rol Funcional <span className="text-destructive">*</span></Label>
                                    <Controller name="role" control={form.control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'role', label: 'Rol', type: 'select', optionsEndpoint: '/api/employment/roles/' }}
                                            value={field.value} onChange={field.onChange} placeholder="Ej: Empleado..." hasError={!!form.formState.errors.role}
                                        />
                                    )} />
                                    {form.formState.errors.role && <span className="text-xs text-destructive mt-1 block">{form.formState.errors.role.message}</span>}
                                </div>
                                <div className="md:col-span-2 mt-2">

                                    {initialData?.supervisor_info ? (
                                        /* CASO 1 y 2: TIENE UNA POSICIÓN SUPERIOR DEFINIDA */
                                        <div className={cn(
                                            "border rounded-md p-3 flex items-start gap-3",
                                            initialData.supervisor_info.name === "VACANTE"
                                                ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900" // Estilo Alerta
                                                : "bg-slate-50 dark:bg-slate-900 border-slate-200" // Estilo Normal
                                        )}>
                                            {/* Icono Dinámico */}
                                            <div className={cn(
                                                "p-2 rounded-full border shadow-sm",
                                                initialData.supervisor_info.name === "VACANTE"
                                                    ? "bg-white text-orange-500 dark:bg-slate-950"
                                                    : "bg-white text-indigo-500 dark:bg-slate-950"
                                            )}>
                                                {initialData.supervisor_info.name === "VACANTE"
                                                    ? <AlertCircle className="h-4 w-4" />
                                                    : <GitFork className="h-4 w-4" />
                                                }
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Reporta Directamente a:
                                                </p>

                                                <div className="flex items-center gap-2 mt-1">
                                                    {/* Nombre del Cargo Superior */}
                                                    <span className="font-medium text-sm">
                                                        {initialData.supervisor_info.position}
                                                    </span>

                                                    <span className="text-slate-300">|</span>

                                                    {/* Nombre de la Persona o VACANTE */}
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        initialData.supervisor_info.name === "VACANTE"
                                                            ? "text-orange-600 dark:text-orange-400"
                                                            : "text-foreground"
                                                    )}>
                                                        {initialData.supervisor_info.name}
                                                    </span>
                                                </div>

                                                {/* Mensaje Extra si está Vacante */}
                                                {initialData.supervisor_info.name === "VACANTE" && (
                                                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                                                        ⚠️ Esta posición jerárquica no tiene titular activo.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* CASO 3: NO REPORTA A NADIE (TOP LEVEL / SIN ASIGNAR) */
                                        /* Solo mostramos esto si hay una posición seleccionada, para no confundir si está vacío el form */
                                        form.watch('position') && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-3 flex items-center gap-3">
                                                <div className="bg-white dark:bg-slate-950 p-2 rounded-full border border-blue-100 shadow-sm">
                                                    <Crown className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                        Nivel Jerárquico Superior
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                                        Esta posición no reporta a ningún otro cargo en el sistema.
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Vigencia y Estatus</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <Label>Fecha Ingreso</Label>
                                    <Controller name="hire_date" control={form.control} render={({ field }) => (
                                        <DatePicker selected={field.value} onSelect={field.onChange} className={cn(form.formState.errors.hire_date && "border-destructive")} />
                                    )} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Fecha Fin</Label>
                                    <Controller name="end_date" control={form.control} render={({ field }) => (
                                        <DatePicker selected={field.value || undefined} onSelect={field.onChange} />
                                    )} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Tipo Contrato</Label>
                                    <Controller name="employment_type" control={form.control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'employment_type', label: 'Tipo', type: 'select', optionsEndpoint: '/api/employment/employment-types/' }}
                                            value={field.value} onChange={field.onChange} placeholder="Seleccione..."
                                        />
                                    )} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Estatus</Label>
                                    <Controller name="current_status" control={form.control} render={({ field }) => (
                                        <DynamicCombobox
                                            field={{ name: 'current_status', label: 'Estatus', type: 'select', optionsEndpoint: '/api/employment/employment-statuses/' }}
                                            value={field.value} onChange={field.onChange} placeholder="Seleccione..."
                                        />
                                    )} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting} size="lg">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </div>



                {/* --- GESTIÓN DE ACCESO --- */}
                <div className="space-y-6">
                    {/* ✨ NUEVA TARJETA: IDENTIDAD DEL EMPLEADO ✨ */}
                    {/* Se muestra ARRIBA del Acceso al Sistema */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" /> Identidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Nombre Completo</p>
                                    <p className="text-lg font-bold leading-none text-foreground">
                                        {initialData?.person_full_name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Documento / Cédula</p>
                                    <div className="flex items-center gap-2">
                                        <IdCard className="h-4 w-4 text-indigo-600" />
                                        <span className="font-mono font-medium text-base">
                                            {initialData?.person_document || "Sin Documento"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Lock className="h-4 w-4" /> Acceso al Sistema
                            </CardTitle>
                            <CardDescription>Gestión de credenciales.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {hasUser && userData ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border rounded-md shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Usuario</span>
                                            <span className="font-mono text-sm font-semibold">{userData.username}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {userData.is_active ? (
                                                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-200">
                                                    <UserCheck className="h-3 w-3" /> Activo
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium border border-red-200">
                                                    <Lock className="h-3 w-3" /> Inactivo
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button type="button" variant="outline" className="w-full" onClick={() => setIsManageModalOpen(true)}>
                                        <Pen className="mr-2 h-4 w-4" />
                                        Administrar Cuenta
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800 flex gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>Sin credenciales de acceso.</span>
                                    </div>
                                    <Button type="button" onClick={() => setIsUserModalOpen(true)} className="w-full">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Crear Usuario
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5" />
                        Historial de Movimientos
                    </CardTitle>
                    <CardDescription>
                        Registro de auditoría de cambios de estatus y vigencia del contrato.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha de Inicio</TableHead>
                                <TableHead>Estatus</TableHead>
                                <TableHead>Motivo / Observación</TableHead>
                                <TableHead className="text-right">Registrado el</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData?.status_logs && initialData.status_logs.length > 0 ? (
                                initialData.status_logs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">
                                            {/* Formato fecha local amigable */}
                                            {new Date(log.start_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {log.status_name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={log.reason}>
                                            {log.reason || "-"}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No hay movimientos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            {/* --- MODAL CREAR USUARIO --- */}
            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crear Usuario</DialogTitle>
                        <DialogDescription>Credenciales para {initialData?.person_full_name}.</DialogDescription>
                    </DialogHeader>
                    {userServerError && <Alert variant="destructive"><AlertDescription>{userServerError}</AlertDescription></Alert>}

                    <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Usuario</Label>
                            <Input {...userForm.register("username")} />
                            {userForm.formState.errors.username && <p className="text-xs text-destructive">{userForm.formState.errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Contraseña</Label>
                            <Input type="password" {...userForm.register("password")} />
                            {userForm.formState.errors.password && <p className="text-xs text-destructive">{userForm.formState.errors.password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar</Label>
                            <Input type="password" {...userForm.register("confirm_password")} />
                            {userForm.formState.errors.confirm_password && <p className="text-xs text-destructive">No coinciden</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isCreatingUser}>
                                {isCreatingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- MODAL EDITAR USUARIO --- */}
            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Administrar Acceso</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Detalles</TabsTrigger>
                            <TabsTrigger value="password">Contraseña</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4 py-4">
                            <form onSubmit={editUserForm.handleSubmit(onUpdateUser)} className="space-y-4">

                                {/* 1. CAMPO USERNAME */}
                                <div className="space-y-2">
                                    <Label>Nombre de Usuario</Label>
                                    <Input {...editUserForm.register("username")} />
                                </div>

                                <div className="space-y-4">
                                    {/* 2. SWITCH: ACTIVO / INACTIVO */}
                                    <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-slate-50 dark:bg-slate-900">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Estado de Cuenta</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Permitir inicio de sesión.
                                            </p>
                                        </div>
                                        <Controller
                                            control={editUserForm.control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>

                                    {/* 3. NUEVO SWITCH: ADMIN / USUARIO */}
                                    <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-slate-50 dark:bg-slate-900">
                                        <div className="flex gap-3 items-start">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Permisos de Administrador</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Habilitar acceso total al panel de control.
                                                </p>
                                            </div>
                                        </div>
                                        <Controller
                                            control={editUserForm.control}
                                            name="is_staff"
                                            render={({ field }) => (
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit">Guardar Cambios</Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="password" className="space-y-4 py-4">
                            <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nueva Contraseña</Label>
                                    <Input type="password" {...passwordForm.register("new_password")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirmar</Label>
                                    <Input type="password" {...passwordForm.register("confirm_password")} />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" variant="destructive">Restablecer</Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
            {/* --- MODAL DE TERMINACIÓN (OFFBOARDING) --- */}
            <Dialog open={isTerminateModalOpen} onOpenChange={setIsTerminateModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-l-4 border-l-destructive">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <LogOut className="h-5 w-5" /> Finalizar Relación Laboral
                        </DialogTitle>
                        <DialogDescription>
                            Esta acción cerrará el contrato vigente y desactivará el acceso al sistema.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={terminateForm.handleSubmit(onTerminate)} className="space-y-6 py-4">

                        {/* Fecha de Salida */}
                        <div className="space-y-2">
                            <Label>Fecha de Egreso / Salida</Label>
                            <Controller
                                name="end_date"
                                control={terminateForm.control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <DatePicker
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        className="w-full"
                                    />
                                )}
                            />
                        </div>

                        {/* Motivo (Estatus) */}
                        <div className="space-y-2">
                            <Label>Motivo Principal <span className="text-destructive">*</span></Label>
                            <Controller
                                name="exit_reason"
                                control={terminateForm.control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione causa..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="REN">Renuncia Voluntaria</SelectItem>
                                            <SelectItem value="DES">Despido / Cese</SelectItem>
                                            <SelectItem value="FIN">Fin de Contrato</SelectItem>
                                            <SelectItem value="JUB">Jubilación</SelectItem>
                                            <SelectItem value="FAL">Fallecimiento</SelectItem>
                                            <SelectItem value="OTR">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* CAMPO 2: DETALLE (Opcional pero recomendado) */}
                        <div className="space-y-2">
                            <Label>Observaciones / Carta de Renuncia</Label>
                            <Textarea
                                {...terminateForm.register("exit_notes")}
                                placeholder="Explique brevemente las circunstancias de la salida..."
                                className="resize-none h-24"
                            />
                        </div>

                        {/* Switch de Seguridad */}
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-red-50 dark:bg-red-900/20">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium text-red-900 dark:text-red-200">
                                    Revocar Acceso
                                </Label>
                                <p className="text-xs text-red-700 dark:text-red-300">
                                    Bloquear usuario de sistema inmediatamente.
                                </p>
                            </div>
                            <Controller
                                control={terminateForm.control}
                                name="deactivate_user"
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsTerminateModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Salida"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}