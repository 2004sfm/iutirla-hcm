'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import {
    Loader2, Calendar, Clock, Users, BookOpen,
    FileText, MonitorPlay, GraduationCap, Pen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

// UI para el Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseSessionManager } from './CourseSessionManager';
import { CourseParticipantManager } from './CourseParticipantManager';
import { CourseResourceManager } from './CourseResourceManager';
import { CourseEditModal } from './CourseEditModal';

// Componentes internos (próximos a integrar)
// import { CourseEditModal } from './CourseEditModal'; // Usaremos un modal simple aquí

// --- DATOS FIJOS (Para los Selects) ---
const COURSE_STATUSES = [
    { code: 'BOR', name: 'Borrador', color: "bg-gray-500" },
    { code: 'PRO', name: 'Programado', color: "bg-blue-500" },
    { code: 'EJE', name: 'En Ejecución', color: "bg-green-500" },
    { code: 'FIN', name: 'Finalizado', color: "bg-slate-800" },
    { code: 'CAN', name: 'Cancelado', color: "bg-red-500" },
];

// Tipos
interface CourseDetail {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    status_name: string;
    modality: string;
    modality_display: string;
    max_participants: number;
    enrolled_count: number;
    duration_hours: number;
}

interface CourseManagerProps {
    courseId: number;
}

export function CourseManager({ courseId }: CourseManagerProps) {
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchCourse = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/training/courses/${courseId}/`);
            setCourse(data);
        } catch (err) {
            console.error(err);
            setError("No se pudo cargar la información del curso o no tienes permisos.");
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    // --- ACCIÓN: CAMBIAR ESTADO ---
    const handleStatusChange = async (newStatus: string) => {
        if (!course || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await apiClient.patch(`/api/training/courses/${courseId}/`, {
                status: newStatus
            });

            // Actualización optimista: Solo cambiamos el estado en el objeto local
            const newStatusObj = COURSE_STATUSES.find(s => s.code === newStatus);
            setCourse(prev => prev ? {
                ...prev,
                status: newStatus,
                status_name: newStatusObj?.name || newStatus
            } : null);

            toast.success(`Estado del curso cambiado a ${newStatusObj?.name}.`);
        } catch (err) {
            toast.error("Error al actualizar el estado del curso.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- CÁLCULOS VISUALES ---
    if (loading) {
        return <div className="flex h-60 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (error || !course) {
        return <Alert variant="destructive"><AlertDescription>{error || "Curso no encontrado"}</AlertDescription></Alert>;
    }

    const occupancy = Math.round((course.enrolled_count / course.max_participants) * 100);
    const currentStatus = COURSE_STATUSES.find(s => s.code === course.status);

    // Función de color
    const getStatusColor = (status: string) => {
        return COURSE_STATUSES.find(s => s.code === status)?.color || "bg-slate-500";
    };

    return (
        <div className="space-y-6">

            {/* 1. ENCABEZADO DEL CURSO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">

                {/* LADO IZQUIERDO: Título y Datos */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{course.name}</h1>
                        {/* El badge muestra el estado actual */}
                        <Badge className={getStatusColor(course.status)}>{course.status_name}</Badge>
                    </div>
                    {/* decripcion */}
                    {course.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {course.description}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MonitorPlay className="h-4 w-4" /> {course.modality_display}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> {new Date(course.start_date).toLocaleDateString()} - {new Date(course.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> {course.duration_hours} Horas
                        </span>
                    </div>
                </div>

                {/* LADO DERECHO: ACCIONES DE GESTIÓN */}
                <div className="flex items-center gap-4">

                    {/* CONTROL DE ESTADO (SELECT) */}
                    <Select value={course.status} onValueChange={handleStatusChange} disabled={isSubmitting}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={course.status_name} />
                        </SelectTrigger>
                        <SelectContent>
                            {COURSE_STATUSES.map(s => (
                                <SelectItem key={s.code} value={s.code}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* BOTÓN DE EDICIÓN DE DETALLE */}
                    <Button variant="outline" size="icon" onClick={() => setIsEditModalOpen(true)}>
                        <Pen className="h-4 w-4" />
                    </Button>

                    {/* Tarjeta de Cupo Rápida (Se mantiene igual) */}
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                        <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Ocupación</p>
                            <p className="text-lg font-bold font-mono">
                                {course.enrolled_count} <span className="text-muted-foreground text-sm">/ {course.max_participants}</span>
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full border-4 border-slate-200 flex items-center justify-center text-[10px] font-bold relative">
                            {occupancy}%
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ÁREA DE TRABAJO (TABS) */}
            <Tabs defaultValue="plan" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                    <TabsTrigger value="plan" className="gap-2">
                        <BookOpen className="h-4 w-4" /> Planificación
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="gap-2">
                        <FileText className="h-4 w-4" /> Recursos
                    </TabsTrigger>
                    <TabsTrigger value="people" className="gap-2">
                        <Users className="h-4 w-4" /> Participantes
                    </TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA A: SESIONES (CLASES) --- */}
                <TabsContent value="plan" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Agenda y Horarios</h3>
                            <p className="text-sm text-muted-foreground">Gestione el horario y temas a impartir. Se requiere esta agenda para pasar asistencia.</p>
                        </div>
                    </div>
                    <Separator />

                    {/* Renderizamos el Gestor de Sesiones */}
                    {/* Le pasamos las fechas límites para que el manager valide que las sesiones caigan dentro del rango */}
                    {course.start_date && course.end_date && (
                        <CourseSessionManager
                            courseId={courseId}
                            courseStartDate={course.start_date}
                            courseEndDate={course.end_date}
                        />
                    )}
                </TabsContent>

                {/* --- PESTAÑA B: RECURSOS --- */}
                <TabsContent value="resources" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Biblioteca de Contenidos</h3>
                            <p className="text-sm text-muted-foreground">Centralice aquí las guías, presentaciones y videos para los estudiantes.</p>
                        </div>
                    </div>
                    <Separator />

                    {/* COMPONENTE REAL */}
                    <CourseResourceManager courseId={courseId} />

                </TabsContent>

                {/* --- PESTAÑA C: PARTICIPANTES --- */}
                {/* --- PESTAÑA C: PARTICIPANTES --- */}
                <TabsContent value="people" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Estudiantes e Instructores</h3>
                            <p className="text-sm text-muted-foreground">Gestión de inscripciones y roles académicos.</p>
                        </div>
                    </div>
                    <Separator />

                    {/* COMPONENTE REAL */}
                    <CourseParticipantManager courseId={courseId} />

                </TabsContent>

            </Tabs>
            {course && (
                <CourseEditModal
                    isOpen={isEditModalOpen}
                    setIsOpen={setIsEditModalOpen}
                    courseData={course}
                    onSuccess={fetchCourse} // Recargamos los datos al guardar
                />
            )}
        </div>
    );
}