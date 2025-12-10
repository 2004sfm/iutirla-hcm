"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Grid3x3, Loader2, Search } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import { Course, EnrollmentStatus } from "@/types/course";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

interface CourseWithEnrollment extends Course {
    user_enrollment_status?: EnrollmentStatus;
}

export default function CoursesPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"my-courses" | "available">("my-courses");
    const [myCoursesSearch, setMyCoursesSearch] = useState("");
    const [availableCoursesSearch, setAvailableCoursesSearch] = useState("");

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
        if (enrollment.course) {
            enrollmentMap.set(Number(enrollment.course), enrollment.enrollment_status);
        }
    });

    // Separar cursos en "Mis Cursos" y "Disponibles"
    let myCourses: CourseWithEnrollment[] = [];
    let availableCourses: Course[] = [];

    allCourses?.forEach((course) => {
        const enrollmentStatus = enrollmentMap.get(course.id);
        const isInstructor = user?.person?.id === course.instructor_id;

        // Curso va a "Mis Cursos" si:
        // 1. El usuario está inscrito (tiene enrollment_status)
        // 2. El usuario es el instructor
        if (enrollmentStatus || isInstructor) {
            myCourses.push({ ...course, user_enrollment_status: enrollmentStatus });
        } else {
            availableCourses.push(course);
        }
    });

    // Filter courses based on search
    if (myCoursesSearch) {
        myCourses = myCourses.filter(course =>
            course.name.toLowerCase().includes(myCoursesSearch.toLowerCase()) ||
            course.description?.toLowerCase().includes(myCoursesSearch.toLowerCase())
        );
    }

    if (availableCoursesSearch) {
        availableCourses = availableCourses.filter(course =>
            course.name.toLowerCase().includes(availableCoursesSearch.toLowerCase()) ||
            course.description?.toLowerCase().includes(availableCoursesSearch.toLowerCase())
        );
    }

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
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Capacitación</h1>
                    <p className="text-muted-foreground mt-1">
                        Explora y gestiona tu formación profesional
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="w-full flex flex-col md:grid md:grid-cols-2 h-auto p-1 bg-muted/50 gap-1">
                    <TabsTrigger
                        value="my-courses"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <BookOpen className="mr-1 size-4" />
                        <p className="truncate">
                            Mis Cursos
                        </p>
                    </TabsTrigger>
                    <TabsTrigger
                        value="available"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                    >
                        <Grid3x3 className="mr-1 size-4" />
                        <p className="truncate">
                            Cursos Disponibles
                        </p>
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-6">
                    {/* My Courses Tab */}
                    <TabsContent value="my-courses" className="m-0 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en mis cursos..."
                                className="pl-9"
                                value={myCoursesSearch}
                                onChange={(e) => setMyCoursesSearch(e.target.value)}
                            />
                        </div>

                        {myCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {myCoursesSearch ? "No se encontraron cursos" : "No tienes cursos inscritos"}
                                </h3>
                                <p className="text-muted-foreground">
                                    {myCoursesSearch ? "Intenta con otros términos de búsqueda" : "Explora los cursos disponibles y solicita tu inscripción"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        enrollmentStatus={course.user_enrollment_status}
                                        isInstructor={user?.person?.id === course.instructor_id}
                                        href={`/training/${course.id}`}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Available Courses Tab */}
                    <TabsContent value="available" className="m-0 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cursos disponibles..."
                                className="pl-9"
                                value={availableCoursesSearch}
                                onChange={(e) => setAvailableCoursesSearch(e.target.value)}
                            />
                        </div>

                        {availableCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Grid3x3 className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {availableCoursesSearch ? "No se encontraron cursos" : "No hay cursos disponibles"}
                                </h3>
                                <p className="text-muted-foreground">
                                    {availableCoursesSearch ? "Intenta con otros términos de búsqueda" : "Todos los cursos activos ya están en tu lista"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        href={`/training/${course.id}`}
                                        showEnrollButton={true}
                                        onEnrollmentSuccess={() => {
                                            mutate("/api/training/courses/");
                                            if (user?.person) {
                                                mutate(`/api/training/participants/?person=${user.person.id}`);
                                            }
                                        }}
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
