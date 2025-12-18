"use client";

import { use, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, BookOpen, FileText, Users, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import {
    Course,
    CourseSession,
    CourseResource,
    ParticipantListItem,
    courseStatusDisplay,
    courseModalityDisplay,
    enrollmentStatusDisplay
} from "@/types/course";
import apiClient from "@/lib/api-client";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import CoursePersonnel from "@/components/courses/course-personnel";
import CourseRequests from "@/components/courses/course-requests";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setLabel } = useBreadcrumb();

    const { data: course, error, isLoading } = useSWR<Course>(
        `/api/training/courses/${id}/`,
        fetcher
    );

    const defaultTab = searchParams.get("tab") || "general";

    useEffect(() => {
        if (course) {
            const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            setLabel(normalizedPath, course.name);
        }
    }, [course, pathname, setLabel]);

    if (isLoading) {
        return <CourseDetailSkeleton />;
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">No se pudo cargar la información del curso.</p>
                <Button onClick={() => router.back()}>Volver</Button>
            </div>
        );
    }

    // Configuration for Sessions (Syllabus)
    const sessionsFields: CatalogField[] = [
        { name: "topic", label: "Tema / Título", type: "text", required: true },
        { name: "date", label: "Fecha", type: "date", required: true },
        { name: "start_time", label: "Hora Inicio (HH:MM)", type: "text", required: true },
        { name: "end_time", label: "Hora Fin (HH:MM)", type: "text", required: true },
        { name: "course", label: "Curso", type: "hidden", defaultValue: parseInt(id) },
    ];

    const sessionsColumns: ColumnDef<CourseSession>[] = [
        { accessorKey: "topic", header: "Tema" },
        {
            accessorKey: "date",
            header: "Fecha",
            cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString('es-ES')
        },
        {
            accessorKey: "start_time",
            header: "Hora Inicio",
            cell: ({ row }) => (row.getValue("start_time") as string).substring(0, 5)
        },
        {
            accessorKey: "end_time",
            header: "Hora Fin",
            cell: ({ row }) => (row.getValue("end_time") as string).substring(0, 5)
        },
    ];

    // Configuration for Students
    const studentsColumns: ColumnDef<ParticipantListItem>[] = [
        { accessorKey: "person_name", header: "Estudiante" },
        {
            accessorKey: "enrollment_status",
            header: "Estado Inscripción",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {enrollmentStatusDisplay[row.original.enrollment_status]}
                </Badge>
            )
        },
        {
            accessorKey: "academic_status_name",
            header: "Estado Académico"
        },
        {
            accessorKey: "grade",
            header: "Nota",
            cell: ({ row }) => row.original.grade ? `${row.original.grade}/20` : "N/A"
        },
    ];

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
                        <Badge variant="outline">
                            {courseStatusDisplay[course.status]}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                        <span>{courseModalityDisplay[course.modality]}</span>
                        <span>•</span>
                        <span>{course.duration_hours}h</span>
                        <span>•</span>
                        <span>{course.enrolled_count}/{course.max_participants} inscritos</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/admin/training/${id}/edit`)}>
                        <Edit className="mr-2 size-4" />
                        Editar Curso
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 size-4" />
                        Volver
                    </Button>
                </div>
            </div>

            <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
                <TabsList className="w-full flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50 gap-1">
                    <TabsTrigger
                        value="general"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <BookOpen className="mr-1 size-4" />
                        <p className="truncate">Información General</p>
                    </TabsTrigger>
                    <TabsTrigger
                        value="syllabus"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <FileText className="mr-1 size-4" />
                        <p className="truncate">Programa / Sesiones</p>
                    </TabsTrigger>
                    <TabsTrigger
                        value="people"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <Users className="mr-1 size-4" />
                        <p className="truncate">Personas</p>
                    </TabsTrigger>
                    <TabsTrigger
                        value="requests"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <Users className="mr-1 size-4" />
                        <p className="truncate">Solicitudes</p>
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6">
                    <TabsContent value="general" className="m-0 h-full">
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Descripción</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                        {course.description || "No hay descripción disponible."}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalles del Curso</CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Inicio</p>
                                        <p className="text-sm">{new Date(course.start_date).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Fin</p>
                                        <p className="text-sm">{new Date(course.end_date).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Duración</p>
                                        <p className="text-sm">{course.duration_hours} horas</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Cupo Máximo</p>
                                        <p className="text-sm">{course.max_participants} estudiantes</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {course.instructor_name && !course.instructor_name.includes('NoneType') && !course.instructor_name.includes('method-wrapper') && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Instructor Asignado</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Badge variant="secondary">
                                            {course.instructor_name}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="syllabus" className="m-0 h-full">
                        <CatalogCRUD
                            title=""
                            apiUrl={`/api/training/sessions/?course=${id}`}
                            fields={sessionsFields}
                            columns={sessionsColumns}
                            searchKey="topic"
                        />
                    </TabsContent>

                    <TabsContent value="people" className="m-0 h-full">
                        <CoursePersonnel courseId={id} />
                    </TabsContent>

                    <TabsContent value="requests" className="m-0 h-full">
                        <CourseRequests courseId={id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function CourseDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        </div>
    );
}
