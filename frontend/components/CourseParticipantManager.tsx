'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, UserPlus, Trash2, Shield, GraduationCap, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

// --- 1. ESQUEMA ACTUALIZADO ---
const participantSchema = z.object({
    person: z.string().min(1, "Debe seleccionar una persona."),
    role: z.string().min(1, "Debe seleccionar un rol."),
    // Nuevos campos opcionales (para edición)
    status: z.string().optional(),
    grade: z.coerce.number().min(0).max(20).optional().nullable(), // Escala 0-20 (ajusta si usas 100)
});

type ParticipantFormData = z.infer<typeof participantSchema>;

export function CourseParticipantManager({ courseId }: { courseId: number }) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estado para Edición
    const [editingId, setEditingId] = useState<number | null>(null);

    // Delete
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

    // Formulario
    const form = useForm({
        resolver: zodResolver(participantSchema),
        defaultValues: {
            person: "",
            role: "EST",
            status: "PEN",
            grade: null // o undefined, dependiendo de tu preferencia
        }
    });

    const { control, handleSubmit, formState: { errors }, reset, watch } = form;

    // Observamos el rol para saber si mostrar el campo de nota (los profesores no llevan nota)
    const currentRole = watch("role");

    // Fetch
    const fetchParticipants = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/training/participants/?course=${courseId}`);
            setItems(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando participantes.");
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

    // --- ABRIR MODAL (CREAR O EDITAR) ---
    const openModal = (item?: any) => {
        setServerError(null);
        if (item) {
            // MODO EDICIÓN (Evaluar)
            setEditingId(item.id);
            reset({
                person: String(item.person_id), // Asumiendo que el serializer envía person_id
                role: item.role,
                status: item.status,
                grade: item.grade
            });
        } else {
            // MODO CREACIÓN (Inscribir)
            setEditingId(null);
            reset({ person: "", role: "EST", status: "PEN", grade: null });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: ParticipantFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            // LÓGICA DIVIDIDA: CREAR vs EDITAR

            if (editingId) {
                // --- CASO EDITAR (PATCH) ---
                // Solo enviamos lo que se puede cambiar.
                // NO enviamos 'person' ni 'course', así evitamos el error de "nulo".
                const editPayload = {
                    role: data.role,
                    status: data.status,
                    grade: data.grade
                };

                await apiClient.patch(`/api/training/participants/${editingId}/`, editPayload);
                toast.success("Participante actualizado.");

            } else {
                // --- CASO CREAR (POST) ---
                // Aquí sí enviamos todo porque es nuevo.
                const createPayload = {
                    course: courseId,
                    person: Number(data.person), // Aquí data.person sí tiene valor del combobox
                    role: data.role,
                    status: 'INS', // Estatus inicial por defecto
                    grade: null
                };

                await apiClient.post('/api/training/participants/', createPayload);
                toast.success("Participante inscrito correctamente.");
            }

            setIsModalOpen(false);
            fetchParticipants();
        } catch (error: any) {
            // ... (Tu manejo de errores sigue igual) ...
            if (error.response?.data) {
                const backendErrors = error.response.data;
                // ...
                // Agrega un console.log para ver qué llega si vuelve a fallar
                console.log("Errores Backend:", backendErrors);
                // ...
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminar
    const handleDeleteClick = (item: any) => {
        setItemToDelete({ id: item.id, name: item.person_name });
        setIsDeleteAlertOpen(true);
    };

    const deleteItemAction = async () => {
        if (!itemToDelete) return;
        await apiClient.delete(`/api/training/participants/${itemToDelete.id}/`);
        fetchParticipants();
    };

    // Helper visuales
    const getRoleBadge = (role: string, roleName: string) => {
        if (role === 'INS') return <Badge className="bg-indigo-600 hover:bg-indigo-700"><Shield className="w-3 h-3 mr-1" /> {roleName}</Badge>;
        return <Badge variant="secondary"><GraduationCap className="w-3 h-3 mr-1" /> {roleName}</Badge>;
    };

    const getStatusBadge = (status: string, statusName: string) => {
        switch (status) {
            case 'APR': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">{statusName}</Badge>;
            case 'REP': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">{statusName}</Badge>;
            case 'PEN': return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">{statusName}</Badge>;
            case 'INS': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">{statusName}</Badge>;
            default: return <span className="text-muted-foreground text-xs">{statusName}</span>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    Listado Oficial
                </h3>
                <Button size="sm" onClick={() => openModal()}>
                    <UserPlus className="size-4 mr-2" /> Inscribir
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Participante</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead>Nota</TableHead>
                            <TableHead className="text-right w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6">Cargando...</TableCell></TableRow>
                        ) : items.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No hay participantes inscritos.</TableCell></TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.person_name}</TableCell>
                                    <TableCell>{getRoleBadge(item.role, item.role_name)}</TableCell>
                                    <TableCell>{getStatusBadge(item.status, item.status_name)}</TableCell>
                                    <TableCell className="font-mono font-bold text-sm">{item.grade ? item.grade : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {/* BOTÓN EDITAR (Lápiz) */}
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(item)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteClick(item)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* MODAL UNIVERSAL (CREAR / EDITAR) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Evaluar / Editar" : "Inscribir Participante"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        {/* 1. PERSONA (Deshabilitada al editar) */}
                        <div className="space-y-1">
                            <Label>Persona <span className="text-destructive">*</span></Label>
                            {editingId ? (
                                // Modo Lectura al Editar
                                <div className="p-2 border rounded-md bg-muted text-sm text-muted-foreground">
                                    {/* Buscamos el nombre en la lista actual para mostrarlo, ya que el combobox espera ID */}
                                    {items.find(i => i.id === editingId)?.person_name || "Participante seleccionado"}
                                </div>
                            ) : (
                                // Modo Selección al Crear
                                <Controller
                                    name="person"
                                    control={control}
                                    render={({ field }) => (
                                        <DynamicCombobox
                                            field={{
                                                name: 'person', label: 'Persona', type: 'select',
                                                optionsEndpoint: '/api/core/persons/?has_id=true', optionsLabelKey: 'hiring_search'
                                            }}
                                            value={field.value} onChange={field.onChange} placeholder="Buscar..." hasError={!!errors.person}
                                        />
                                    )}
                                />
                            )}
                            {errors.person && <p className="text-xs text-destructive">Requerido</p>}
                        </div>

                        {/* 2. ROL */}
                        <div className="space-y-1">
                            <Label>Rol</Label>
                            {/* Si se edita, idealmente no se cambia el rol, pero lo dejamos flexible */}
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!editingId}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EST">Estudiante (Participante)</SelectItem>
                                            <SelectItem value="INS">Instructor (Facilitador)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* 3. CAMPOS DE EVALUACIÓN (Solo visibles si es Estudiante o se está editando) */}
                        {(currentRole === 'EST') && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground font-bold">Estatus Final</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="SOL">Solicitud Enviada</SelectItem>

                                                    {/* <SelectItem value="PEN">Pendiente</SelectItem> */}
                                                    <SelectItem value="INS">Inscrito</SelectItem>
                                                    <SelectItem value="APR">Aprobado</SelectItem>
                                                    <SelectItem value="REP">Reprobado</SelectItem>
                                                    <SelectItem value="RET">Retirado</SelectItem>
                                                    <SelectItem value="REJ">Solicitud Rechazada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground font-bold">Nota (0-20)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="h-8 text-xs"
                                        placeholder="Ej: 18"
                                        {...form.register("grade")}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingId ? "Actualizar" : "Inscribir")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE DIALOG */}
            {itemToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteAlertOpen}
                    setOpen={setIsDeleteAlertOpen}
                    onConfirmDelete={deleteItemAction}
                    title="¿Desvincular?"
                    description={`¿Seguro que deseas eliminar a ${itemToDelete.name}?`}
                    successMessage="Participante eliminado."
                />
            )}
        </div>
    );
}