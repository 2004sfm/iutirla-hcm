"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Calendar,
    Clock,
    Users,
    BookOpen,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Info,
    FileText,
    ArrowRight,
    Settings
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import {
    Course,
    EnrollmentStatus,
    courseModalityDisplay,
    courseStatusDisplay
} from "@/types/course";

interface CourseCardProps {
    course: Course;
    enrollmentStatus?: EnrollmentStatus;
    academicProgress?: number; // 0-100
    href?: string;
    showEnrollButton?: boolean;
    onEnrollmentSuccess?: () => void;
    isInstructor?: boolean;
}

export function CourseCard({
    course,
    enrollmentStatus,
    academicProgress,
    href,
    showEnrollButton = false,
    onEnrollmentSuccess,
    isInstructor = false,
}: CourseCardProps) {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);
    const [isEnrollmentLoading, setIsEnrollmentLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Backend returns full URLs or null
    const coverImageSrc = !imageError && course.cover_image
        ? course.cover_image
        : "/images/course-placeholder.webp";

    const handleEnroll = async () => {
        setIsEnrollmentLoading(true);
        try {
            await apiClient.post(`/api/training/courses/${course.id}/request_enrollment/`);
            toast.success("Solicitud de inscripción enviada exitosamente");
            setIsModalOpen(false);
            if (onEnrollmentSuccess) {
                onEnrollmentSuccess();
            }
        } catch (error: any) {
            console.error("Error requesting enrollment:", error);
            toast.error(error.response?.data?.error || "Error al solicitar inscripción");
        } finally {
            setIsEnrollmentLoading(false);
        }
    };

    const handleContinue = () => {
        if (href) {
            router.push(href);
        }
    };

    // Determinar el badge de estado de inscripción
    const getEnrollmentBadge = () => {
        if (!enrollmentStatus) return null;

        switch (enrollmentStatus) {
            case EnrollmentStatus.REQUESTED:
                return (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-500">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Solicitud Pendiente
                    </Badge>
                );
            case EnrollmentStatus.ENROLLED:
                return (
                    <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Inscrito
                    </Badge>
                );
            case EnrollmentStatus.REJECTED:
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rechazado
                    </Badge>
                );

            default:
                return null;
        }
    };

    const isEnrolled = enrollmentStatus === EnrollmentStatus.ENROLLED;

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col p-0">
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={coverImageSrc}
                        alt={course.name}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />

                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm">
                            {courseStatusDisplay[course.status]}
                        </Badge>
                    </div>
                </div>

                <CardContent className="flex-1 flex flex-col gap-2 p-4">
                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                            {courseModalityDisplay[course.modality]}
                        </Badge>
                        {getEnrollmentBadge()}
                        {course.is_full && (
                            <Badge variant="destructive" className="text-xs">
                                Cupo Lleno
                            </Badge>
                        )}
                    </div>
                    {/* Course Title */}
                    <h3 className="text-lg font-semibold line-clamp-2">
                        {course.name}
                    </h3>

                    {/* Course Description */}
                    {course.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {course.description}
                        </p>
                    )}

                    <div className="flex flex-col border-t pt-4 mt-auto">

                        {/* Academic Progress (if enrolled) */}
                        {isEnrolled && academicProgress !== undefined && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progreso</span>
                                    <span>{academicProgress}%</span>
                                </div>
                                <Progress value={academicProgress} className="h-2" />
                            </div>
                        )}

                        {/* Course Metadata */}
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {new Date(course.start_date).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{course.duration_hours}h</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{course.enrolled_count}/{course.max_participants}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                    {isInstructor ? (
                        <Button onClick={handleContinue} className="w-full" variant="default">
                            <Settings className="mr-2 h-4 w-4" />
                            Gestionar
                        </Button>
                    ) : isEnrolled ? (
                        <Button onClick={handleContinue} className="w-full">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Continuar
                        </Button>
                    ) : (
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Info className="mr-2 h-4 w-4" />
                                Ver Detalles
                            </Button>
                        </DialogTrigger>
                    )}
                </CardFooter>
            </Card>

            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 border-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Inscripción: {course.name}</DialogTitle>
                    <DialogDescription>Detalles y solicitud de ingreso.</DialogDescription>
                </DialogHeader>

                {/* HEADER CON IMAGEN */}
                <div className="relative h-48 w-full bg-muted">
                    <Image
                        src={coverImageSrc}
                        alt={course.name}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />

                    {/* Gradiente para legibilidad */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
                        <Badge className="w-fit mb-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md shadow-sm">
                            {course.modality_display}
                        </Badge>
                        <h2 className="text-2xl font-bold text-white leading-tight shadow-sm">
                            {course.name}
                        </h2>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Detalles Clave */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>
                                {new Date(course.start_date).toLocaleDateString()} - {new Date(course.end_date).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{course.duration_hours} Horas académicas</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 text-primary" />
                            <span>Cupo: {course.max_participants}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Descripción */}
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                            <FileText className="h-4 w-4" /> Descripción
                        </h3>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                            {course.description || "Sin descripción detallada."}
                        </p>
                    </div>

                    {/* Nota Informativa */}
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs flex gap-2 items-start border border-blue-100">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                            Al solicitar la inscripción, tu perfil será revisado por la coordinación académica.
                            Recibirás acceso al aula virtual una vez sea aprobado.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 bg-slate-50/50 border-t">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    {enrollmentStatus === EnrollmentStatus.REQUESTED ? (
                        <Button disabled className="gap-2" variant="secondary">
                            <AlertCircle className="h-4 w-4" />
                            Solicitud Enviada
                        </Button>
                    ) : showEnrollButton ? (
                        <Button
                            onClick={handleEnroll}
                            disabled={course.is_full || isEnrollmentLoading}
                            className="gap-2"
                        >
                            {isEnrollmentLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            {course.is_full ? "Cupo Lleno" : "Solicitar Inscripción"}
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
