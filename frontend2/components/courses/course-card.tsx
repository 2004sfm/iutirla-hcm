"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Calendar,
    Clock,
    Users,
    BookOpen,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
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
    onEnrollClick?: () => void;
}

export function CourseCard({
    course,
    enrollmentStatus,
    academicProgress,
    href,
    showEnrollButton = false,
    onEnrollClick,
}: CourseCardProps) {
    const [imageError, setImageError] = useState(false);

    const coverImageSrc = !imageError && course.cover_image
        ? course.cover_image
        : "/images/course-placeholder.webp";

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
            case EnrollmentStatus.DROPPED:
                return (
                    <Badge variant="secondary">
                        Retirado
                    </Badge>
                );
            default:
                return null;
        }
    };

    const cardContent = (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            {/* Cover Image */}
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={coverImageSrc}
                    alt={course.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                />
                {/* Status Badge Overlay */}
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                        {courseStatusDisplay[course.status]}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-4 flex-1 flex flex-col">
                {/* Course Title */}
                <h3 className="text-lg font-semibold mb-2 line-clamp-2 min-h-14">
                    {course.name}
                </h3>

                {/* Course Description */}
                {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                    </p>
                )}

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2 mb-4">
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

                {/* Academic Progress (if enrolled) */}
                {enrollmentStatus === EnrollmentStatus.ENROLLED && academicProgress !== undefined && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progreso</span>
                            <span>{academicProgress}%</span>
                        </div>
                        <Progress value={academicProgress} className="h-2" />
                    </div>
                )}

                {/* Course Metadata */}
                <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            </CardContent>

            <CardFooter className="p-4 pt-0">
                {showEnrollButton && onEnrollClick && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onEnrollClick();
                        }}
                        className="w-full"
                        disabled={course.is_full}
                    >
                        <BookOpen className="mr-2 h-4 w-4" />
                        {course.is_full ? "Cupo Lleno" : "Solicitar Inscripción"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );

    // Si hay href, envolver en Link, si no, retornar el card directamente
    if (href) {
        return (
            <Link href={href} className="block h-full">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}
