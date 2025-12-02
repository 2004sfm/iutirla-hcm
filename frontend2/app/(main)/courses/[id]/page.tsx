"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BookOpen,
    FileText,
    Lock,
    Calendar,
    Clock,
    ExternalLink,
    Download,
    ArrowLeft
} from "lucide-react";
import { CourseHeader } from "@/components/courses/course-header";
import {
    Course,
    CourseSession,
    CourseResource,
    EnrollmentStatus,
    UserEnrollment
} from "@/types/course";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Fetch course details
    const { data: course, error, isLoading } = useSWR<Course>(
        `/api/training/courses/${id}/`,
        fetcher
    );

    // Fetch user enrollment status
    const { data: userEnrollment, mutate: mutateEnrollment } = useSWR<UserEnrollment>(
        user?.person ? `/api/training/courses/${id}/my_enrollment/` : null,
        fetcher,
        {
            shouldRetryOnError: false,
            onError: () => {
                // 404 means no enrollment, which is expected
            },
        }
    );

    const handleEnrollmentRequest = async () => {
        setIsEnrolling(true);
        try {
            await apiClient.post(`/api/training/courses/${id}/request_enrollment/`);
            toast.success("Tu solicitud de inscripción ha sido enviada exitosamente.");
            mutateEnrollment(); // Refresh enrollment status
            mutate(`/api/training/courses/${id}/`); // Refresh course data
        } catch (error: any) {
            toast.error(error.response?.data?.error || "No se pudo enviar la solicitud.");
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleManageRequests = () => {
        // Navigate to admin view for this course
        router.push(`/admin/courses/${id}?tab=students`);
    };

    if (isLoading) {
        return <CourseDetailSkeleton />;
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">No se pudo cargar la información del curso.</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>
        );
    }

    // Determinar si el usuario está inscrito (enrolled)
    const isEnrolled = userEnrollment?.enrollment_status === EnrollmentStatus.ENROLLED;

    return (
        <div className="flex flex-col space-y-6 p-8">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="w-fit">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cursos
            </Button>

            {/* Course Header */}
            <CourseHeader
                course={course}
                userEnrollment={userEnrollment}
                onEnrollmentRequest={handleEnrollmentRequest}
                onManageRequests={handleManageRequests}
                isLoadingEnrollment={isEnrolling}
            />

            {/* Tabs: Overview & Modules */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <TabsList className="w-full md:w-auto bg-muted/50 p-1">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 transition-all duration-300"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Información General
                    </TabsTrigger>
                    <TabsTrigger
                        value="modules"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 transition-all duration-300"
                    >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Módulos y Sesiones
                        {!isEnrolled && <Lock className="ml-2 h-4 w-4" />}
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="m-0">
                        <div className="grid gap-6">
                            {/* Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Descripción del Curso</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {course.description || "No hay descripción disponible."}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Resources */}
                            {course.resources && course.resources.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recursos y Materiales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {course.resources.map((resource) => (
                                                <div
                                                    key={resource.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {resource.resource_type === 'FIL' ? (
                                                            <Download className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <ExternalLink className="h-5 w-5 text-primary" />
                                                        )}
                                                        <span className="font-medium">{resource.name}</span>
                                                    </div>
                                                    {resource.url ? (
                                                        <Button asChild variant="outline" size="sm">
                                                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                                Abrir
                                                            </a>
                                                        </Button>
                                                    ) : resource.file ? (
                                                        <Button asChild variant="outline" size="sm">
                                                            <a href={resource.file} download>
                                                                Descargar
                                                            </a>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Modules Tab */}
                    <TabsContent value="modules" className="m-0">
                        {!isEnrolled ? (
                            <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <Lock className="h-16 w-16 text-yellow-600 dark:text-yellow-500 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Contenido Bloqueado</h3>
                                    <p className="text-muted-foreground">
                                        Debes estar inscrito en el curso para acceder a los módulos y sesiones.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : course.sessions && course.sessions.length > 0 ? (
                            <div className="grid gap-4">
                                {course.sessions.map((session, index) => (
                                    <SessionCard key={session.id} session={session} index={index} />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No hay sesiones programadas</h3>
                                    <p className="text-muted-foreground">
                                        El instructor aún no ha configurado las sesiones del curso.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function SessionCard({ session, index }: { session: CourseSession; index: number }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                            {index + 1}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{session.topic}</CardTitle>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(session.date).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

function CourseDetailSkeleton() {
    return (
        <div className="space-y-6 p-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
