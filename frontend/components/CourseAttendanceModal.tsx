'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Loader2, Save, Check, X, Clock, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

// UI
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// --- TIPOS ---
interface AttendanceModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    sessionId: number;
    sessionTopic: string;
    courseId: number;
}

interface StudentAttendance {
    participant_id: number;
    person_name: string;
    record_id: number | null; // Si es null, no se ha tomado lista aún
    status: 'PRE' | 'AUS' | 'TAR' | 'JUS'; // Presente, Ausente, Tarde, Justificado
    notes: string;
}

const STATUS_OPTIONS = [
    { code: 'PRE', label: 'Presente', icon: Check, color: 'text-green-600 bg-green-50 border-green-200' },
    { code: 'AUS', label: 'Ausente', icon: X, color: 'text-red-600 bg-red-50 border-red-200' },
    { code: 'TAR', label: 'Tardanza', icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { code: 'JUS', label: 'Justif.', icon: FileQuestion, color: 'text-blue-600 bg-blue-50 border-blue-200' },
] as const;

export function CourseAttendanceModal({ isOpen, setIsOpen, sessionId, sessionTopic, courseId }: AttendanceModalProps) {
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            // 1. Traer Estudiantes Inscritos (Solo los aceptados 'INS')
            const participantsRes = await apiClient.get(`/api/training/participants/?course=${courseId}`);
            const allParticipants = participantsRes.data.results || participantsRes.data;
            const enrolledStudents = allParticipants.filter((p: any) => p.role === 'EST' && p.status === 'INS');

            // 2. Traer Asistencias ya guardadas para esta sesión
            // (Usamos el endpoint custom que creamos en el backend: /sessions/ID/attendance/)
            const attendanceRes = await apiClient.get(`/api/training/sessions/${sessionId}/attendance/`);
            const existingRecords = attendanceRes.data;

            // 3. FUSIONAR DATOS
            const mergedData: StudentAttendance[] = enrolledStudents.map((student: any) => {
                // Buscar si ya tiene registro
                const record = existingRecords.find((r: any) => r.participant === student.id);

                return {
                    participant_id: student.id,
                    person_name: student.person_name,
                    record_id: record ? record.id : null,
                    status: record ? record.status : 'PRE', // Default: Presente
                    notes: record ? record.notes : ''
                };
            });

            setStudents(mergedData);

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la lista de estudiantes.");
        } finally {
            setLoading(false);
        }
    }, [courseId, sessionId]);

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, fetchData]);

    // --- MANEJADORES ---
    const handleStatusChange = (participantId: number, newStatus: any) => {
        setStudents(prev => prev.map(s =>
            s.participant_id === participantId ? { ...s, status: newStatus } : s
        ));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            // Enviamos las peticiones en paralelo (Promise.all)
            // Nota: En un sistema masivo, esto debería ser un endpoint 'bulk_create' en backend.
            // Para < 50 alumnos, esto funciona bien.

            const promises = students.map(student => {
                const payload = {
                    session: sessionId,
                    participant: student.participant_id,
                    status: student.status,
                    notes: student.notes
                };

                if (student.record_id) {
                    // Update (PATCH)
                    return apiClient.patch(`/api/training/attendance/${student.record_id}/`, payload);
                } else {
                    // Create (POST)
                    return apiClient.post('/api/training/attendance/', payload);
                }
            });

            await Promise.all(promises);
            toast.success("Asistencia guardada correctamente.");
            setIsOpen(false);

        } catch (error) {
            console.error(error);
            toast.error("Hubo un error al guardar algunos registros.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">

                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Control de Asistencia</DialogTitle>
                    <DialogDescription>
                        Sesión: <span className="font-medium text-foreground">{sessionTopic}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 pt-2">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            No hay estudiantes inscritos oficialmente en este curso.
                        </div>
                    ) : (
                        <div className="border rounded-md h-full overflow-hidden flex flex-col">
                            {/* HEADER TABLA */}
                            <div className="grid grid-cols-12 bg-muted/50 p-3 text-xs font-medium text-muted-foreground border-b">
                                <div className="col-span-5 pl-2">ESTUDIANTE</div>
                                <div className="col-span-7 text-center">ESTADO</div>
                            </div>

                            {/* LISTA SCROLLABLE */}
                            <ScrollArea className="flex-1">
                                {students.map((student) => (
                                    <div key={student.participant_id} className="grid grid-cols-12 items-center p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <div className="col-span-5 font-medium text-sm pl-2 truncate">
                                            {student.person_name}
                                        </div>

                                        {/* BOTONES DE ESTADO */}
                                        <div className="col-span-7 flex justify-center gap-1">
                                            {STATUS_OPTIONS.map((opt) => {
                                                const isSelected = student.status === opt.code;
                                                const Icon = opt.icon;
                                                return (
                                                    <button
                                                        key={opt.code}
                                                        type="button"
                                                        onClick={() => handleStatusChange(student.participant_id, opt.code)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center w-14 h-12 rounded-md border transition-all duration-200",
                                                            isSelected
                                                                ? opt.color + " ring-1 ring-offset-1 ring-current font-semibold shadow-sm"
                                                                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                        )}
                                                    >
                                                        <Icon className="h-4 w-4 mb-1" />
                                                        <span className="text-[10px]">{opt.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-4 bg-muted/20 border-t">
                    <div className="flex justify-between w-full items-center">
                        <p className="text-xs text-muted-foreground">
                            Total estudiantes: {students.length}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSubmitting || students.length === 0}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar Asistencia
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}