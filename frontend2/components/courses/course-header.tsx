"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Clock,
    Users,
    Calendar,
    UserCheck,
    Settings
} from "lucide-react";
import {
    Course,
    EnrollmentStatus,
    UserEnrollment,
    enrollmentStatusDisplay,
    courseModalityDisplay
} from "@/types/course";
import { useAuth } from "@/context/auth-context";

interface CourseHeaderProps {
    course: Course;
    userEnrollment?: UserEnrollment | null;
    onEnrollmentRequest?: () => void;
    onManageRequests?: () => void;
    isLoadingEnrollment?: boolean;
}

export function CourseHeader({
    course,
    userEnrollment,
    onEnrollmentRequest,
    onManageRequests,
    isLoadingEnrollment = false,
}: CourseHeaderProps) {
    const { user } = useAuth();
    const [imageError, setImageError] = useState(false);

    // Determinar si el usuario puede gestionar solicitudes (Admin o Instructor)
    const canManageRequests = user?.is_staff || userEnrollment?.is_instructor;

    // Determinar la imagen de portada con fallback
    const coverImageSrc = !imageError && course.cover_image
        ? course.cover_image
        : "/images/course-placeholder.webp";

    // --- LÓGICA DEL BOTÓN DINÁMICO ---
    const getActionButton = () => {
        // Si no hay información de inscripción, mostrar botón de solicitud
        if (!userEnrollment || !userEnrollment.enrollment_status) {
            return (
                <Button
                    size="lg"
                    onClick={onEnrollmentRequest}
                    disabled={isLoadingEnrollment || course.is_full}
                    className="bg-primary hover:bg-primary/90"
                >
                    <BookOpen className="mr-2 h-5 w-5" />
                    {course.is_full ? "Cupo Lleno" : "Solicitar Inscripción"}
                </Button>
            );
        }

        switch (userEnrollment.enrollment_status) {
            case EnrollmentStatus.REQUESTED:
                return (
                    <Button
                        size="lg"
                        disabled
                        variant="outline"
                        className="border-yellow-500 text-yellow-600 dark:text-yellow-500"
                    >
                        <Clock className="mr-2 h-5 w-5" />
                        Solicitud Pendiente
                    </Button>
                );

            case EnrollmentStatus.REJECTED:
                return (
                    <Badge variant="destructive" className="text-base px-4 py-2">
                        Solicitud Rechazada
                    </Badge>
                );

            case EnrollmentStatus.ENROLLED:
                return (
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Continuar Curso
                    </Button>
                );

            case EnrollmentStatus.DROPPED:
                return (
                    <Badge variant="secondary" className="text-base px-4 py-2">
                        Retirado del Curso
                    </Badge>
                );

            default:
                return null;
        }
    };

    return (
        <div className="relative w-full">
            {/* Cover Image Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-t-lg">
                <Image
                    src={coverImageSrc}
                    alt={course.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Course Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                        {course.name}
                    </h1>
                    <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                            {courseModalityDisplay[course.modality]}
                        </Badge>
                        {course.is_full && (
                            <Badge variant="destructive" className="bg-red-500/80 backdrop-blur-sm">
                                Cupo Lleno
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Info & Action Section */}
            <div className="bg-card border-x border-b rounded-b-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Course Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Inicio</p>
                                <p className="text-sm font-medium">
                                    {new Date(course.start_date).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Fin</p>
                                <p className="text-sm font-medium">
                                    {new Date(course.end_date).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Duración</p>
                                <p className="text-sm font-medium">{course.duration_hours}h</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Cupo</p>
                                <p className="text-sm font-medium">
                                    {course.enrolled_count}/{course.max_participants}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {canManageRequests && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={onManageRequests}
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                                <Settings className="mr-2 h-5 w-5" />
                                Gestionar Solicitudes
                            </Button>
                        )}
                        {getActionButton()}
                    </div>
                </div>

                {/* Instructors Section */}
                {course.instructors && course.instructors.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">
                                {course.instructors.length === 1 ? 'Instructor' : 'Instructores'}
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {course.instructors.map((instructor) => (
                                <Badge key={instructor.id} variant="secondary" className="text-sm">
                                    {instructor.person_name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
