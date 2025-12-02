"use client";

import { useState, use, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, User, Contact, FileText, Users, Mail, Phone, MapPin, CreditCard, Globe, Pencil, GraduationCap, Link as LinkIcon, Briefcase, Calendar, History, Lock, UserPlus, UserCheck, Ban, UserMinus, AlertTriangle } from "lucide-react";
import { EmploymentForm } from "@/components/personnel/EmploymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api-client";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const { setLabel } = useBreadcrumb();
    const [isEditing, setIsEditing] = useState(false);
    const { data: employment, error, isLoading } = useSWR(`/api/employment/employments/${id}/`, fetcher);

    useEffect(() => {
        if (employment) {
            const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            setLabel(normalizedPath, employment.person_full_name);
        }
    }, [employment, pathname, setLabel]);

    if (isLoading) return <EmployeeDetailSkeleton />;
    if (error || !employment) return <EmployeeError router={router} />;

    const getStatusVariant = (status: string) => {
        if (status === "ACT") return "default";
        if (status === "TER") return "destructive";
        return "secondary";
    };

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                        {employment.person_photo && (
                            <AvatarImage src={employment.person_photo} alt={employment.person_full_name} />
                        )}
                        <AvatarFallback className="text-xl">
                            {employment.person_full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center sm:items-start">
                        <h1 className="text-2xl font-bold tracking-tight">{employment.person_full_name}</h1>
                        <div className="flex items-center text-muted-foreground mt-1 gap-2">
                            <Badge variant={getStatusVariant(employment.current_status) as any}>
                                {employment.current_status_display.charAt(0).toUpperCase() + employment.current_status_display.slice(1).toLowerCase()}
                            </Badge>
                            <span className="text-sm">• {employment.role_display}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 justify-center">
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => isEditing ? setIsEditing(false) : router.back()}>
                        <ArrowLeft className="size-4" />
                        {isEditing ? "Cancelar" : null}
                    </Button>
                </div>
            </div>

            {isEditing ? (
                <EmploymentForm
                    initialData={{
                        ...employment,
                        department: employment.department_id // Pass department ID for pre-filling
                    }}
                    isEditing={true}
                    employmentId={id}
                    onSuccess={() => {
                        setIsEditing(false);
                        mutate(`/api/employment/employments/${id}/`);
                    }}
                />
            ) : (
                /* Content - Single View (No Tabs) */
                <div className="grid gap-6 md:grid-cols-2">

                    {/* Row 1: User Account (Spans 2 columns) */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Acceso al Sistema</CardTitle>
                            </div>
                            <CardDescription>Gestión de credenciales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {employment.user_account_details ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuario</p>
                                            <p className="text-lg font-bold">{employment.user_account_details.username}</p>
                                        </div>
                                        {employment.user_account_details.is_active ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                                                <UserCheck className="h-3 w-3" />
                                                Activo
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1">
                                                <Ban className="h-3 w-3" />
                                                Inactivo
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <ResetPasswordDialog
                                            personId={employment.person}
                                            username={employment.user_account_details.username}
                                            trigger={
                                                <Button variant="outline" className="w-full">
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Administrar Cuenta
                                                </Button>
                                            }
                                        />
                                        {employment.user_account_details.is_active ? (
                                            <DeactivateUserDialog
                                                personId={employment.person}
                                                username={employment.user_account_details.username}
                                                onSuccess={() => mutate(`/api/employment/employments/${id}/`)}
                                                trigger={
                                                    <Button variant="destructive" className="w-full">
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Desactivar Cuenta
                                                    </Button>
                                                }
                                            />
                                        ) : (
                                            <ActivateUserDialog
                                                personId={employment.person}
                                                username={employment.user_account_details.username}
                                                onSuccess={() => mutate(`/api/employment/employments/${id}/`)}
                                                trigger={
                                                    <Button className="w-full bg-green-600 hover:bg-green-700">
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Activar Cuenta
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                                        Este empleado no tiene acceso al sistema.
                                    </div>
                                    <CreateUserDialog
                                        personId={employment.person}
                                        onSuccess={() => mutate(`/api/employment/employments/${id}/`)}
                                        trigger={
                                            <Button className="w-full">
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Crear Cuenta
                                            </Button>
                                        }
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Row 2, Col 1: Position Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                Información del Cargo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow label="Cargo" value={employment.position_full_name} />
                            <InfoRow label="Departamento" value={employment.department_name} />
                            <InfoRow label="Tipo de Empleo" value={employment.employment_type_display} />

                            {employment.supervisor_info ? (
                                <div className="pt-2 mt-2">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Supervisor Inmediato</p>
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />

                                        <span className="text-sm font-medium">{employment.supervisor_info.name.charAt(0).toUpperCase() + employment.supervisor_info.name.slice(1).toLowerCase()}</span>
                                        <span className="text-xs text-muted-foreground">({employment.supervisor_info.position})</span>
                                    </div>
                                </div>
                            ) : (
                                <InfoRow label="Supervisor" value="No asignado" />
                            )}
                        </CardContent>
                    </Card>

                    {/* Row 2-3, Col 2: Status History (Spans 2 rows) */}
                    <Card className="md:row-span-2 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Historial de Estatus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-muted ml-2 space-y-6">
                                {employment.status_logs && employment.status_logs.length > 0 ? (
                                    employment.status_logs.map((log: any, index: number) => (
                                        <div key={log.id} className="ml-4 relative">
                                            <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.status_name}</span>
                                                <span className="text-xs text-muted-foreground">{log.start_date} {log.end_date ? ` - ${log.end_date}` : '(Actual)'}</span>
                                                {log.comments && <p className="text-xs text-muted-foreground mt-1 italic">"{log.comments}"</p>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground ml-4">No hay historial disponible.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Row 3, Col 1: Contract Dates */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Fechas del Contrato
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow label="Fecha de Contratación" value={employment.hire_date} />
                            <InfoRow label="Fecha de Finalización" value={employment.end_date || "Indefinido"} />

                            {!employment.end_date && (
                                <TerminateContractDialog
                                    employmentId={id}
                                    onSuccess={() => mutate(`/api/employment/employments/${id}/`)}
                                    trigger={
                                        <Button variant="destructive" className="w-full mt-2">
                                            <UserMinus className="mr-2 h-4 w-4" />
                                            Finalizar Contrato
                                        </Button>
                                    }
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}


function InfoRow({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-right">{value || "-"}</span>
        </div>
    );
}

function EmployeeDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        </div>
    );
}


function EmployeeError({ router }: { router: any }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar la información del empleado.</p>
            <Button onClick={() => router.back()}>Volver</Button>
        </div>
    );
}

function CreateUserDialog({ personId, onSuccess, trigger }: { personId: number, onSuccess: (username: string) => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await apiClient.post(`/api/core/persons/${personId}/create-user-account/`, { password });
            toast.success(`Usuario creado: ${res.data.username}`);
            onSuccess(res.data.username);
            setOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Error al crear usuario");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Usuario</DialogTitle>
                    <DialogDescription>
                        Ingrese una contraseña para el nuevo usuario. El nombre de usuario se generará automáticamente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creando..." : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ResetPasswordDialog({ personId, username, trigger }: { personId: number, username: string, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post(`/api/core/persons/${personId}/reset-password/`, { password });
            toast.success("Contraseña actualizada exitosamente");
            setOpen(false);
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Error al actualizar contraseña");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                        Ingrese una nueva contraseña para el usuario <strong>{username}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Actualizando..." : "Actualizar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeactivateUserDialog({ personId, username, onSuccess, trigger }: { personId: number, username: string, onSuccess: () => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDeactivate = async () => {
        setIsLoading(true);
        try {
            await apiClient.post(`/api/core/persons/${personId}/deactivate-user/`);
            toast.success(`Usuario ${username} desactivado.`);
            onSuccess();
            setOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Error al desactivar usuario");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Desactivar Usuario
                    </DialogTitle>
                    <DialogDescription>
                        ¿Está seguro que desea desactivar el usuario <strong>{username}</strong>?
                        El empleado no podrá acceder al sistema, pero su contrato permanecerá activo.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDeactivate} disabled={isLoading}>
                        {isLoading ? "Desactivando..." : "Desactivar Cuenta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ActivateUserDialog({ personId, username, onSuccess, trigger }: { personId: number, username: string, onSuccess: () => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleActivate = async () => {
        setIsLoading(true);
        try {
            await apiClient.post(`/api/core/persons/${personId}/activate-user/`);
            toast.success(`Usuario ${username} activado.`);
            onSuccess();
            setOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Error al activar usuario");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <UserCheck className="h-5 w-5" />
                        Activar Usuario
                    </DialogTitle>
                    <DialogDescription>
                        ¿Está seguro que desea activar el usuario <strong>{username}</strong>?
                        El empleado podrá acceder nuevamente al sistema.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleActivate} disabled={isLoading}>
                        {isLoading ? "Activando..." : "Activar Cuenta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TerminateContractDialog({ employmentId, onSuccess, trigger }: { employmentId: string, onSuccess: () => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [deactivateUser, setDeactivateUser] = useState(true);

    const handleTerminate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await apiClient.post(`/api/employment/employments/${employmentId}/terminate/`, {
                end_date: endDate,
                exit_reason: reason,
                exit_notes: notes,
                deactivate_user: deactivateUser
            });
            toast.success("Contrato finalizado exitosamente.");
            onSuccess();
            setOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Error al finalizar contrato");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <UserMinus className="h-5 w-5" />
                        Finalizar Contrato
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción finalizará el contrato actual y registrará la salida del empleado.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTerminate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="end-date">Fecha de Finalización</Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo de Salida</Label>
                        <Input
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej. Renuncia voluntaria, Despido..."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas Adicionales</Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Detalles adicionales..."
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="deactivate"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={deactivateUser}
                            onChange={(e) => setDeactivateUser(e.target.checked)}
                        />
                        <Label htmlFor="deactivate" className="font-normal">
                            Desactivar usuario del sistema automáticamente
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" type="submit" disabled={isLoading}>
                            {isLoading ? "Procesando..." : "Finalizar Contrato"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
