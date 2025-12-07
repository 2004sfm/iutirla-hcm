"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Users,
    Calendar,
    UserCheck
} from "lucide-react";
import {
    Course,
    courseModalityDisplay
} from "@/types/course";

interface CourseHeaderProps {
    course: Course;
}

export function CourseHeader({ course }: CourseHeaderProps) {
    const [imageError, setImageError] = useState(false);

    // Determinar la imagen de portada con fallback
    const coverImageSrc = !imageError && course.cover_image
        ? course.cover_image
        : "/images/course-placeholder.webp";

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

            {/* Info Section */}
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
                </div>

                {/* Instructor Section */}
                {course.instructor_name && (
                    <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Instructor</h3>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                            {course.instructor_name}
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
}
