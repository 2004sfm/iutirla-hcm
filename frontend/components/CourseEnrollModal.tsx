'use client';

import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from "@/context/AuthContext";
import {
    Loader2, Calendar, Clock, Users,
    CheckCircle2, FileText, Info
} from "lucide-react";
import { toast } from "sonner";
import Image from 'next/image';

// UI
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// CONSTANTE DE IMAGEN
const DEFAULT_COVER = "/images/course-placeholder.png";

interface CourseEnrollModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    course: any;
    onSuccess: () => void;
}

export function CourseEnrollModal({ isOpen, setIsOpen, course, onSuccess }: CourseEnrollModalProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!course) return null;

    // Lógica de Imagen
    const imageSrc = course.cover_image || DEFAULT_COVER;
    // Solo desactivamos la optimización si la imagen viene de Django (localhost)
    // Si es la local (/images/...), Next.js la puede optimizar sin problemas.
    const shouldUnoptimize = !!course.cover_image;

    const handleEnrollRequest = async () => {
        if (!user?.person?.id) {
            toast.error("Error de identidad: No tienes un perfil de empleado asociado.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                course: course.id,
                person: user.person.id,
                role: 'EST',
                status: 'SOL'
            };

            await apiClient.post('/api/training/participants/', payload);

            toast.success("Solicitud enviada. El administrador revisará tu inscripción.");
            onSuccess();
            setIsOpen(false);

        } catch (error: any) {
            if (error.response?.data?.person || error.response?.data?.non_field_errors) {
                toast.error("Ya tienes una solicitud o inscripción en este curso.");
            } else {
                toast.error("No se pudo procesar la solicitud.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">

                {/* CORRECCIÓN ACCESIBILIDAD (Título oculto) */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Inscripción: {course.name}</DialogTitle>
                    <DialogDescription>Detalles y solicitud de ingreso.</DialogDescription>
                </DialogHeader>

                {/* HEADER CON IMAGEN */}
                <div className="relative h-48 w-full bg-muted">
                    <Image
                        src={imageSrc}
                        alt={course.name}
                        fill
                        className="object-cover"
                        unoptimized={shouldUnoptimize} // True si viene de Django, False si es local
                    />

                    {/* Gradiente para legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
                        <Badge className="w-fit mb-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md shadow-sm">
                            {course.modality_display}
                        </Badge>
                        <h2 className="text-2xl font-bold text-white leading-tight shadow-sm">
                            {course.name}
                        </h2>
                    </div>
                </div>

                <ScrollArea className="max-h-[50vh]">
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
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 bg-slate-50/50 border-t">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleEnrollRequest} disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Solicitar Inscripción
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}