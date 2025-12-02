"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Grid3x3, Loader2 } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import { Course, EnrollmentStatus } from "@/types/course";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface CourseWithEnrollment extends Course {
    user_enrollment_status?: EnrollmentStatus;
}

export default function CoursesPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"my-courses" | "available">("my-courses");

    // Fetch all available courses
    const { data: allCourses, error, isLoading } = useSWR<Course[]>(
        "/api/training/courses/",
        fetcher
    );

    // Fetch user's enrollments
    const { data: userEnrollments } = useSWR<any[]>(
        user?.person ? `/api/training/participants/?person=${user.person.id}` : null,
        fetcher
    );

    // Crear un mapa de course_id -> enrollment_status
    const enrollmentMap = new Map<number, EnrollmentStatus>();
    userEnrollments?.forEach((enrollment) => {
        enrollmentMap.set(enrollment.course, enrollment.enrollment_status);
    });

    // Separar cursos en "Mis Cursos" y "Disponibles"
    const myCourses: CourseWithEnrollment[] = [];
    const availableCourses: Course[] = [];

    allCourses?.forEach((course) => {
        const enrollmentStatus = enrollmentMap.get(course.id);
        if (enrollmentStatus) {
            myCourses.push({ ...course, user_enrollment_status: enrollmentStatus });
        } else {
            availableCourses.push(course);
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground">No se pudieron cargar los cursos.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cursos</h1>
                    <p className="text-muted-foreground mt-1">
                        Explora y gestiona tu formación profesional
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="w-full md:w-auto bg-muted/50 p-1">
                    <TabsTrigger
                        value="my-courses"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 transition-all duration-300"
                    >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Mis Cursos
                    </TabsTrigger>
                    <TabsTrigger
                        value="available"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 transition-all duration-300"
                    >
                        <Grid3x3 className="mr-2 h-4 w-4" />
                        Cursos Disponibles
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6">
                    {/* My Courses Tab */}
                    <TabsContent value="my-courses" className="m-0">
                        {myCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No tienes cursos inscritos</h3>
                                <p className="text-muted-foreground">
                                    Explora los cursos disponibles y solicita tu inscripción
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        enrollmentStatus={course.user_enrollment_status}
                                        href={`/courses/${course.id}`}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Available Courses Tab */}
                    <TabsContent value="available" className="m-0">
                        {availableCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Grid3x3 className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No hay cursos disponibles</h3>
                                <p className="text-muted-foreground">
                                    Todos los cursos activos ya están en tu lista
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        href={`/courses/${course.id}`}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
