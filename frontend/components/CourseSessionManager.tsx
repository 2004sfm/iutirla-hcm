'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Pencil, Clock, ClipboardList } from "lucide-react"; // Asegúrate de tener Clock o Calendar
import { toast } from "sonner";
import { format } from "date-fns";
import { cn, parseBackendDate } from '@/lib/utils';

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom
import { DatePicker } from "@/components/DatePicker";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { CourseAttendanceModal } from './CourseAttendanceModal';

// --- ESQUEMA ZOD ---
const sessionSchema = z.object({
    topic: z.string().min(3, "El tema es obligatorio."),
    date: z.date({ required_error: "La fecha es requerida." }),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido."),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface CourseSessionManagerProps {
    courseId: number;
    courseStartDate: string;
    courseEndDate: string;
    readOnly?: boolean;
}

export function CourseSessionManager({
    courseId,
    courseStartDate,
    courseEndDate,
    readOnly = false
}: CourseSessionManagerProps) {

    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);

    // Estados Delete
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

    // Dentro de CourseSessionManager...
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<{ id: number, topic: string } | null>(null);

    const openAttendance = (session: any) => {
        setSelectedSessionForAttendance({ id: session.id, topic: session.topic });
        setIsAttendanceModalOpen(true);
    };
    // Formulario
    const form = useForm<SessionFormData>({
        resolver: zodResolver(sessionSchema),
        defaultValues: { topic: "", date: undefined, start_time: "09:00", end_time: "17:00" }
    });

    const { control, handleSubmit, formState: { errors }, reset, register, setError } = form;

    // Validación de fechas
    const validateDateRange = (data: SessionFormData) => {
        const sessionDate = data.date;
        const start = new Date(courseStartDate);
        const end = new Date(courseEndDate);

        if (sessionDate < start || sessionDate > end) {
            setError("date", { type: "manual", message: `La sesión debe estar entre ${new Date(courseStartDate).toLocaleDateString()} y ${new Date(courseEndDate).toLocaleDateString()}.` });
            return false;
        }
        if (data.start_time >= data.end_time) {
            setError("end_time", { type: "manual", message: "Hora fin debe ser mayor a inicio." });
            return false;
        }
        return true;
    };

    // Fetch
    const fetchSessions = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/training/sessions/?course=${courseId}`);
            setItems(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando agenda.");
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    // Modal
    const openModal = (item?: any) => {
        setServerError(null);
        if (item) {
            setEditingSessionId(item.id);
            reset({
                topic: item.topic,
                date: parseBackendDate(item.date),
                start_time: item.start_time?.substring(0, 5) || "09:00",
                end_time: item.end_time?.substring(0, 5) || "17:00",
            });
        } else {
            setEditingSessionId(null);
            reset({ topic: "", date: undefined, start_time: "09:00", end_time: "17:00" });
        }
        setIsModalOpen(true);
    };

    // Submit
    const onSubmit = async (data: SessionFormData) => {
        if (!validateDateRange(data)) return;

        setIsSubmitting(true);
        setServerError(null);
        const isEditing = editingSessionId !== null;

        try {
            const payload = {
                course: courseId,
                topic: data.topic,
                date: format(data.date, "yyyy-MM-dd"),
                start_time: data.start_time,
                end_time: data.end_time,
            };

            if (isEditing) {
                await apiClient.patch(`/api/training/sessions/${editingSessionId}/`, payload);
                toast.success(`Sesión actualizada.`);
            } else {
                await apiClient.post('/api/training/sessions/', payload);
                toast.success(`Sesión programada.`);
            }

            setIsModalOpen(false);
            fetchSessions();
        } catch (error: any) {
            setServerError("Error al guardar sesión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete
    const handleDeleteClick = (item: any) => {
        setItemToDelete({ id: item.id, name: item.topic });
        setIsDeleteAlertOpen(true);
    };

    const deleteItemAction = async () => {
        if (!itemToDelete) return;
        await apiClient.delete(`/api/training/sessions/${itemToDelete.id}/`);
        fetchSessions();
    };

    return (
        <div className="space-y-4">

            {/* --- HEADER UNIFICADO (IGUAL QUE RECURSOS) --- */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    Agenda de Sesiones
                </h3>

                {/* El botón ahora está arriba */}
                {!readOnly && (
                    <Button size="sm" onClick={() => openModal()}>
                        <Plus className="size-4 mr-2" /> Programar Sesión
                    </Button>
                )}
            </div>

            {/* TABLA */}
            <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[150px]">Fecha</TableHead>
                            <TableHead className="w-[150px]">Horario</TableHead>
                            <TableHead>Tema</TableHead>
                            {!readOnly && <TableHead className="text-right w-[100px]">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-6">Cargando...</TableCell></TableRow>
                        ) : items.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No hay sesiones programadas.</TableCell></TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <CalendarIcon className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                                        {new Date(item.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                                    </TableCell>
                                    <TableCell>{item.topic}</TableCell>

                                    {!readOnly && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* {!readOnly && ( */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                    title="Tomar Asistencia"
                                                    onClick={() => openAttendance(item)}
                                                >
                                                    <ClipboardList className="size-4" />
                                                </Button>
                                                {/* )} */}
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(item)}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteClick(item)}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {selectedSessionForAttendance && (
                    <CourseAttendanceModal
                        isOpen={isAttendanceModalOpen}
                        setIsOpen={setIsAttendanceModalOpen}
                        sessionId={selectedSessionForAttendance.id}
                        sessionTopic={selectedSessionForAttendance.topic}
                        courseId={courseId}
                    />
                )}
            </div>

            {/* El botón de abajo fue eliminado */}

            {/* MODALES */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle>{editingSessionId ? "Editar Sesión" : "Programar Nueva Sesión"}</DialogTitle></DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

                        {serverError && <Alert variant="destructive" className="mb-2"><AlertDescription>{serverError}</AlertDescription></Alert>}

                        <div className="space-y-1">
                            <Label>Tema de la Sesión <span className="text-destructive">*</span></Label>
                            <Input {...register("topic")} placeholder="Ej: Introducción al Módulo de Finanzas" />
                            {errors.topic && <p className="text-xs text-destructive">{errors.topic.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Día <span className="text-destructive">*</span></Label>
                                <Controller
                                    name="date"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker selected={field.value} onSelect={field.onChange} placeholder="Seleccione día" className={cn(errors.date && "border-destructive")} />
                                    )}
                                />
                                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label>Horario</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="time"
                                        {...register("start_time")}
                                        className={cn(errors.start_time && "border-destructive")}
                                    />
                                    <Input
                                        type="time"
                                        {...register("end_time")}
                                        className={cn(errors.end_time && "border-destructive")}
                                    />
                                </div>
                                {(errors.start_time || errors.end_time) && <p className="text-xs text-destructive">Horario inválido.</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Guardar Agenda"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {itemToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteAlertOpen}
                    setOpen={setIsDeleteAlertOpen}
                    onConfirmDelete={deleteItemAction}
                    title="¿Eliminar Sesión de Clase?"
                    description={`¿Seguro que deseas eliminar el tema "${itemToDelete.name}"?`}
                    successMessage="Sesión eliminada exitosamente."
                />
            )}
        </div>
    );
}