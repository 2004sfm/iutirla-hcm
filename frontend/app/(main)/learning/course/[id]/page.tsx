'use client';

import { useState, useEffect, use } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import {
    Loader2, BookOpen, FileText, Users, ArrowLeft,
    MessageSquare, ShieldCheck
} from "lucide-react";

// UI
import { CatalogHeader } from "@/components/CatalogHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

// --- REUTILIZAMOS TUS COMPONENTES (LA LÓGICA YA EXISTE) ---
import { CourseSessionManager } from "@/components/CourseSessionManager";
import { CourseResourceManager } from "@/components/CourseResourceManager";
import { CourseParticipantManager } from "@/components/CourseParticipantManager";

export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = useAuth();
    const router = useRouter();
    const resolvedParams = use(params);
    const courseId = parseInt(resolvedParams.id);

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ESTADO CLAVE: ¿Es el usuario actual un instructor de este curso?
    const [isInstructor, setIsInstructor] = useState(false);

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                // 1. Obtenemos los datos del curso (Incluye listas de estudiantes e instructores)
                const { data } = await apiClient.get(`/api/training/courses/${courseId}/`);
                setCourse(data);

                // 2. Lógica tipo "Google Classroom": Determinar rol
                if (user?.person?.id) {
                    // Buscamos si mi ID está en la lista de 'instructors' que devuelve el serializer
                    const amIInstructor = data.instructors.some(
                        (inst: any) => inst.person_id === user.person!.id
                    );

                    // También permitimos que el ADMIN vea la vista de profesor si quiere supervisar
                    if (amIInstructor || user.is_staff) {
                        setIsInstructor(true);
                    }
                }

            } catch (err) {
                console.error(err);
                setError("No tienes acceso a este curso o no existe.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCourseData();
        }
    }, [courseId, user]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (error) return (
        <div className="p-8 flex flex-col items-center gap-4">
            <Alert variant="destructive" className="max-w-xl"><AlertDescription>{error}</AlertDescription></Alert>
            <Button onClick={() => router.push('/learning')}>Volver al Centro de Aprendizaje</Button>
        </div>
    );

    return (
        <>
            {/* Header simple de navegación */}
            <CatalogHeader items={[
                { name: "Mis Cursos", href: "/learning" },
                { name: course.name, href: "#" }
            ]} hideSidebarTrigger />

            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">

                {/* 1. PORTADA DEL CURSO (Estilo Classroom) */}
                <div className="relative rounded-xl overflow-hidden bg-indigo-600 text-white p-6 md:p-10 shadow-md">
                    <div className="relative z-10 max-w-3xl space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold">{course.name}</h1>
                            {isInstructor && (
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Vista Profesor
                                </Badge>
                            )}
                        </div>
                        <p className="text-indigo-100 text-lg">{course.description || "Sin descripción."}</p>
                        <div className="pt-4 flex gap-4 text-sm font-medium text-indigo-200">
                            <span>📅 {new Date(course.start_date).toLocaleDateString()} - {new Date(course.end_date).toLocaleDateString()}</span>
                            <span>• {course.modality_display}</span>
                        </div>
                    </div>
                    {/* Decoración de fondo */}
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
                </div>

                {/* 2. TABS DE NAVEGACIÓN (Tablón / Trabajo de Clase / Personas) */}
                <Tabs defaultValue="resources" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[600px] bg-white dark:bg-slate-900 border shadow-sm">
                        <TabsTrigger value="resources" className="gap-2">
                            <FileText className="h-4 w-4" /> Materiales
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="gap-2">
                            <BookOpen className="h-4 w-4" /> Sesiones
                        </TabsTrigger>
                        {/* Si es Profesor ve "Personas/Notas", si es alumno ve "Personas" (compañeros) */}
                        <TabsTrigger value="people" className="gap-2">
                            <Users className="h-4 w-4" /> {isInstructor ? "Estudiantes y Notas" : "Participantes"}
                        </TabsTrigger>
                    </TabsList>

                    {/* --- A. RECURSOS (Material de Apoyo) --- */}
                    <TabsContent value="resources" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                        <Card>
                            <CardContent className="">
                                <CourseResourceManager
                                    courseId={courseId}
                                    // LA MAGIA: Si es instructor edita (false), si es alumno solo lee (true)
                                    readOnly={!isInstructor}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- B. SESIONES (Agenda) --- */}
                    <TabsContent value="sessions" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                        <Card>
                            <CardContent className="">
                                <CourseSessionManager
                                    courseId={courseId}
                                    courseStartDate={course.start_date}
                                    courseEndDate={course.end_date}
                                    readOnly={!isInstructor}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- C. PERSONAS (Notas y Lista) --- */}
                    <TabsContent value="people" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                        <Card>
                            <CardContent className="">
                                {isInstructor ? (
                                    // MODO PROFESOR: Puede calificar y ver todo
                                    <CourseParticipantManager courseId={courseId} />
                                ) : (
                                    // MODO ALUMNO: Solo ve la lista (podrías crear un componente ReadOnlyParticipantManager si quieres ocultar notas)
                                    // Por ahora, reutilizamos ocultando acciones si tu componente soporta readOnly (si no, mostrará la tabla)
                                    <div className="text-center py-10">
                                        <h3 className="font-medium text-lg">Tus Compañeros e Instructores</h3>
                                        <p className="text-muted-foreground">
                                            {/* Aquí podrías mapear course.students y course.instructors en una lista simple */}
                                            Lista de clase visible solo para el profesor por privacidad (o implementa readOnly en ParticipantManager).
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}