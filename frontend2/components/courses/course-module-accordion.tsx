"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    Circle,
    PlayCircle,
    FileText,
    Clock,
    Lock,
    ExternalLink,
    Download,
    File,
    Trash2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CourseModule, CourseLesson, LessonProgress } from "@/types/course";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

interface CourseModuleAccordionProps {
    modules: CourseModule[];
    progress?: LessonProgress[];
    onLessonComplete?: (lessonId: number) => void;
    isInstructor?: boolean;
    onUpdateModule?: (moduleId: number, newName: string) => void;
    onDeleteModule?: (moduleId: number) => void;
}

export function CourseModuleAccordion({
    modules,
    progress = [],
    onLessonComplete,
    isInstructor = false,
    onUpdateModule,
    onDeleteModule
}: CourseModuleAccordionProps) {
    const router = useRouter();
    const [completingLessonId, setCompletingLessonId] = useState<number | null>(null);

    // Edit Module State
    const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
    const [moduleToEdit, setModuleToEdit] = useState<{ id: number; name: string } | null>(null);
    const [newModuleName, setNewModuleName] = useState("");

    // Delete Module State
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [moduleToDeleteId, setModuleToDeleteId] = useState<number | null>(null);

    const isLessonCompleted = (lessonId: number) => {
        return progress.some(p => p.lesson === lessonId && p.completed);
    };

    const handleMarkComplete = async (e: React.MouseEvent, lessonId: number) => {
        e.stopPropagation();
        if (isLessonCompleted(lessonId)) return;

        setCompletingLessonId(lessonId);
        try {
            await apiClient.post(`/api/training/lesson-progress/mark_complete/`, {
                lesson_id: lessonId
            });
            toast.success("Lección completada");
            if (onLessonComplete) onLessonComplete(lessonId);
        } catch (error) {
            console.error("Error marking lesson complete:", error);
            toast.error("Error al marcar como completada");
        } finally {
            setCompletingLessonId(null);
        }
    };

    const handleUnmarkComplete = async (e: React.MouseEvent, lessonId: number) => {
        e.stopPropagation();
        const progressRecord = progress.find(p => p.lesson === lessonId);
        if (!progressRecord) return;

        try {
            await apiClient.delete(`/api/training/lesson-progress/${progressRecord.id}/`);
            toast.success("Lección desmarcada");
            if (onLessonComplete) onLessonComplete(lessonId);
        } catch (error) {
            console.error("Error unmarking lesson:", error);
            toast.error("Error al desmarcar lección");
        }
    };

    const openEditModal = (module: CourseModule) => {
        setModuleToEdit({ id: module.id, name: module.name });
        setNewModuleName(module.name);
        setIsEditModuleOpen(true);
    };

    const handleUpdateModuleSubmit = () => {
        if (moduleToEdit && onUpdateModule && newModuleName.trim()) {
            onUpdateModule(moduleToEdit.id, newModuleName);
            setIsEditModuleOpen(false);
            setModuleToEdit(null);
            setNewModuleName("");
        }
    };

    const openDeleteAlert = (moduleId: number) => {
        setModuleToDeleteId(moduleId);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteModuleConfirm = () => {
        if (moduleToDeleteId && onDeleteModule) {
            onDeleteModule(moduleToDeleteId);
            setIsDeleteAlertOpen(false);
            setModuleToDeleteId(null);
        }
    };

    if (!modules || modules.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No hay contenido disponible para este curso aún.</p>
            </div>
        );
    }

    return (
        <>
            <Accordion type="multiple" className="w-full space-y-4">
                {modules.map((module) => (
                    <AccordionItem
                        key={module.id}
                        value={`module-${module.id}`}
                        className="border rounded-lg bg-card px-4 relative pb-12 last:border-b" // Added pb-12 for button space
                    >
                        <div className="flex items-center w-full">
                            <AccordionTrigger chevronPosition="left" className="hover:no-underline py-4 flex-1">
                                <div className="flex flex-col items-start text-left w-full">
                                    <div className="flex items-center w-full justify-between pr-4">
                                        <span className="font-semibold text-lg">{module.name}</span>
                                        <Badge variant="secondary" className="ml-2">
                                            {module.lessons?.length || 0} lecciones
                                        </Badge>
                                    </div>
                                    {module.description && (
                                        <p className="text-sm text-muted-foreground mt-1 font-normal">
                                            {module.description}
                                        </p>
                                    )}
                                </div>
                            </AccordionTrigger>
                        </div>

                        <AccordionContent className="pt-2 pb-4 space-y-2">
                            {module.lessons && module.lessons.length > 0 ? (
                                <div className="space-y-2">
                                    {module.lessons.map((lesson) => {
                                        const completed = isLessonCompleted(lesson.id);

                                        return (
                                            <div
                                                key={lesson.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-md border transition-colors",
                                                    completed ? "bg-green-50/50 border-green-100" : "bg-background hover:bg-accent/50"
                                                )}
                                            >
                                                <div className="flex items-center space-x-3 overflow-hidden">
                                                    <div className={cn(
                                                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                                                        completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                                                    )}>
                                                        {completed ? (
                                                            <CheckCircle className="h-5 w-5" />
                                                        ) : (
                                                            <PlayCircle className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "font-medium truncate",
                                                            completed && "text-muted-foreground line-through decoration-green-500/30"
                                                        )}>
                                                            {lesson.title}
                                                        </span>
                                                        <div className="flex items-center text-xs text-muted-foreground space-x-2">
                                                            <span className="flex items-center">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {lesson.duration_minutes} min
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/courses/${module.course}/lessons/${lesson.id}`)}
                                                    >
                                                        Ver Contenido
                                                    </Button>

                                                    {!isInstructor && !completed && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8"
                                                            onClick={(e) => handleMarkComplete(e, lesson.id)}
                                                            disabled={completingLessonId === lesson.id}
                                                        >
                                                            {completingLessonId === lesson.id ? "..." : "Marcar Listo"}
                                                        </Button>
                                                    )}

                                                    {!isInstructor && completed && (
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                Completado
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-muted-foreground hover:text-destructive"
                                                                onClick={(e) => handleUnmarkComplete(e, lesson.id)}
                                                            >
                                                                Desmarcar
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic pl-4">
                                    No hay lecciones en este módulo.
                                </p>
                            )}
                        </AccordionContent>

                        {/* Instructor Actions - Bottom Right */}
                        {isInstructor && (
                            <div className="absolute bottom-2 right-4 flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => openEditModal(module)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => openDeleteAlert(module.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </AccordionItem>
                ))}
            </Accordion>

            {/* Edit Module Dialog */}
            <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Módulo</DialogTitle>
                        <DialogDescription>
                            Modifica el nombre del módulo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre del Módulo</Label>
                            <Input
                                id="name"
                                value={newModuleName}
                                onChange={(e) => setNewModuleName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModuleOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateModuleSubmit}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el módulo y todas las lecciones asociadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteModuleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
