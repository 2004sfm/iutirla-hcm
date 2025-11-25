'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { CatalogHeader } from "@/components/CatalogHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, MonitorPlay, Clock } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from "@/context/AuthContext";

const DEFAULT_COVER = "/images/course-placeholder.png";

// 1. INTERFAZ ACTUALIZADA PARA LEER EL ESTATUS
interface CourseStudent {
    person_id: number;
    status: string;      // 'SOL', 'INS', 'APR'...
    status_name: string; // 'Solicitado', 'Inscrito'...
}

interface Course {
    id: number;
    name: string;
    description: string;
    cover_image: string | null;
    start_date: string;
    end_date: string;
    modality_display: string;
    status: string;
    status_name: string;
    is_full: boolean;
    enrolled_count: number;
    // Listas detalladas
    instructors: { person_id: number }[];
    students: CourseStudent[];
}

export default function LearningCenterPage() {
    const { user } = useAuth();
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const { data } = await apiClient.get('/api/training/courses/');
            const coursesArray = Array.isArray(data) ? data : (data.results || []);
            setAllCourses(coursesArray);
        } catch (error) {
            console.error("Error cargando cursos", error);
            setAllCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- FILTROS ---

    // Mis Cursos: Donde soy Instructor O Estudiante (Cualquier estatus: Inscrito o Solicitado)
    const myCourses = allCourses.filter(course => {
        if (!user?.person?.id) return false;
        const myId = user.person.id;
        return course.instructors.some(i => i.person_id === myId) ||
            course.students.some(s => s.person_id === myId);
    });

    // Catálogo: Públicos y donde NO estoy ni siquiera solicitado
    const catalog = allCourses.filter(c => {
        const isPublic = c.status === 'PRO' || c.status === 'EJE';
        const alreadyIn = myCourses.find(mine => mine.id === c.id);
        return isPublic && !alreadyIn;
    });

    return (
        <>
            {/* <CatalogHeader items={[{ name: "Centro de Aprendizaje", href: "/learning" }]} hideSidebarTrigger /> */}

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Centro de Aprendizaje</h1>
                    <p className="text-muted-foreground">Gestiona tu formación y explora nuevos conocimientos.</p>
                </div>

                <Tabs defaultValue="my-courses" className="w-full">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
                        <TabsTrigger value="my-courses">Mis Cursos ({myCourses.length})</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo ({catalog.length})</TabsTrigger>
                    </TabsList>

                    {/* MIS CURSOS */}
                    <TabsContent value="my-courses">
                        {loading ? <CourseGridSkeleton /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myCourses.length > 0 ? (
                                    myCourses.map(course => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            isMyCourse={true}
                                            currentUserId={user?.person?.id}
                                        />
                                    ))
                                ) : (
                                    <EmptyState message="No tienes cursos asignados ni solicitudes pendientes." />
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* CATÁLOGO */}
                    <TabsContent value="catalog">
                        {loading ? <CourseGridSkeleton /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {catalog.length > 0 ? (
                                    catalog.map(course => (
                                        // Pasamos la función de reload para actualizar la lista tras inscribirse
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            isMyCourse={false}
                                            onEnrollSuccess={fetchData}
                                        />
                                    ))
                                ) : (
                                    <EmptyState message="No hay cursos disponibles para inscripción." />
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

// --- COMPONENTE TARJETA INTELIGENTE ---
import { CourseEnrollModal } from "@/components/CourseEnrollModal";

function CourseCard({ course, isMyCourse, currentUserId, onEnrollSuccess }: any) {
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const imageSrc = course.cover_image || DEFAULT_COVER;

    // 2. DETECTAR MI ESTATUS REAL
    let myStatus = null;
    let myStatusLabel = "";

    if (isMyCourse && currentUserId) {
        // Buscarme en la lista de estudiantes
        const studentRecord = course.students.find((s: any) => s.person_id === currentUserId);
        if (studentRecord) {
            myStatus = studentRecord.status;       // 'SOL', 'INS', 'APR'
            myStatusLabel = studentRecord.status_name; // 'Solicitado', 'Inscrito'
        } else {
            // Si no soy estudiante, soy instructor
            myStatus = 'INS_ROLE';
            myStatusLabel = 'Instructor';
        }
    }

    // Lógica visual según estatus
    const isPending = myStatus === 'SOL';

    return (
        <>
            <Card className="group overflow-hidden flex flex-col h-full border hover:shadow-lg transition-all duration-200 p-0">
                <div className="relative h-48 w-full bg-muted overflow-hidden">
                    <Image
                        src={imageSrc}
                        alt={course.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized={!!course.cover_image}
                    />

                    <div className="absolute top-3 right-3 flex gap-2">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black shadow-sm font-medium">
                            {course.modality_display}
                        </Badge>

                        {/* BADGE DE ESTATUS PERSONAL (Solo en Mis Cursos) */}
                        {isMyCourse && (
                            <Badge className={cn(
                                "shadow-sm",
                                isPending ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
                            )}>
                                {myStatusLabel}
                            </Badge>
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <CardHeader className="">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground border-muted-foreground/30">
                            {course.status_name}
                        </Badge>
                    </div>
                    <h3 className="font-bold text-lg leading-snug line-clamp-2" title={course.name}>
                        {course.name}
                    </h3>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                        {course.description || "Sin descripción detallada."}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(course.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                            <Users className="h-3.5 w-3.5" />
                            <span>{course.enrolled_count}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 mt-auto">
                    {isMyCourse ? (
                        // LÓGICA BOTÓN MIS CURSOS
                        isPending ? (
                            <Button className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200" disabled>
                                <Clock className="mr-2 h-4 w-4" /> Esperando Aprobación
                            </Button>
                        ) : (
                            <Button className="w-full" asChild>
                                <Link href={`/learning/course/${course.id}`}>
                                    Continuar <MonitorPlay className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )
                    ) : (
                        // LÓGICA BOTÓN CATÁLOGO
                        <Button
                            className="w-full"
                            variant="secondary"
                            disabled={course.is_full}
                            onClick={() => setIsEnrollOpen(true)}
                        >
                            {course.is_full ? "Cupo Lleno" : "Ver Detalles / Inscribirse"}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Modal de Inscripción (Solo se renderiza si venimos del catálogo) */}
            {!isMyCourse && (
                <CourseEnrollModal
                    isOpen={isEnrollOpen}
                    setIsOpen={setIsEnrollOpen}
                    course={course}
                    onSuccess={onEnrollSuccess}
                />
            )}
        </>
    );
}

// ... (EmptyState, Skeleton y imports como antes) ...
import { cn } from '@/lib/utils'; // Asegúrate de importar cn
function EmptyState({ message }: { message: string }) { return <div className="col-span-full py-16 text-center text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed">{message}</div> }
function CourseGridSkeleton() { return <div className="grid grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div> }