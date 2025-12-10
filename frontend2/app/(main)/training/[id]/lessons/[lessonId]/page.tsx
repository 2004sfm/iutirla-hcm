"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    FileText,
    ExternalLink,
    Download,
    CheckCircle,
    Circle,
    Edit,
    Trash2,
    Plus
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { CourseLesson, CourseResource, LessonProgress } from "@/types/course";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function LessonDetailPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
    const { id, lessonId } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    // Fetch Lesson Data
    const { data: lesson, error, isLoading } = useSWR<CourseLesson>(
        `/api/training/lessons/${lessonId}/`,
        fetcher
    );

    // Fetch User Progress for this lesson
    const { data: progress } = useSWR<LessonProgress[]>(
        user?.person ? `/api/training/lesson-progress/?lesson=${lessonId}` : null,
        fetcher
    );

    // 🔧 FIX: Check if user is the SPECIFIC instructor for this course
    const isInstructor = user?.person?.id === lesson?.course_instructor_id || user?.is_staff;
    const isCompleted = progress && progress.length > 0 && progress[0].completed;

    // State for Resource Upload
    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
    const [resourceName, setResourceName] = useState("");
    const [resourceType, setResourceType] = useState<"FIL" | "URL">("FIL");
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [resourceUrl, setResourceUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // State for Lesson Edit
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleMarkComplete = async () => {
        try {
            await apiClient.post("/api/training/lesson-progress/mark_complete/", {
                lesson_id: lessonId
            });
            toast.success("Lección completada");
            mutate(`/api/training/lesson-progress/?lesson=${lessonId}`);
            mutate(`/api/training/courses/${id}/my_enrollment/`); // Update course progress
        } catch (error) {
            console.error("Error marking complete:", error);
            toast.error("Error al marcar como completada");
        }
    };

    const handleUnmarkComplete = async () => {
        if (!progress || progress.length === 0) return;
        try {
            await apiClient.delete(`/api/training/lesson-progress/${progress[0].id}/`);
            toast.success("Lección desmarcada");
            mutate(`/api/training/lesson-progress/?lesson=${lessonId}`);
            mutate(`/api/training/courses/${id}/my_enrollment/`);
        } catch (error) {
            console.error("Error unmarking:", error);
            toast.error("Error al desmarcar la lección");
        }
    };

    // 🆕 NEW: Delete Lesson Handler
    const handleDeleteLesson = async () => {
        if (!confirm("¿Estás seguro de eliminar esta lección?")) return;
        try {
            await apiClient.delete(`/api/training/lessons/${lessonId}/`);
            toast.success("Lección eliminada");
            router.push(`/training`);
        } catch (error) {
            console.error("Error deleting lesson:", error);
            toast.error("Error al eliminar la lección");
        }
    };

    const handleUploadResource = async () => {
        if (!resourceName) {
            toast.error("El nombre es obligatorio");
            return;
        }
        if (resourceType === "FIL" && !resourceFile) {
            toast.error("Debes seleccionar un archivo");
            return;
        }
        if (resourceType === "URL" && !resourceUrl) {
            toast.error("Debes ingresar una URL");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("course", id); // Required by model, though linked to lesson
            formData.append("lesson", lessonId);
            formData.append("name", resourceName);
            formData.append("resource_type", resourceType);

            if (resourceType === "FIL" && resourceFile) {
                formData.append("file", resourceFile);
            } else if (resourceType === "URL") {
                formData.append("url", resourceUrl);
            }

            await apiClient.post("/api/training/resources/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Recurso añadido exitosamente");
            setIsResourceDialogOpen(false);
            setResourceName("");
            setResourceFile(null);
            setResourceUrl("");
            mutate(`/api/training/lessons/${lessonId}/`); // Refresh lesson data
        } catch (error) {
            console.error("Error uploading resource:", error);
            toast.error("Error al subir el recurso");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteResource = async (resourceId: number) => {
        if (!confirm("¿Estás seguro de eliminar este recurso?")) return;
        try {
            await apiClient.delete(`/api/training/resources/${resourceId}/`);
            toast.success("Recurso eliminado");
            mutate(`/api/training/lessons/${lessonId}/`);
        } catch (error) {
            console.error("Error deleting resource:", error);
            toast.error("Error al eliminar el recurso");
        }
    };

    const handleUpdateLesson = async () => {
        setIsSaving(true);
        try {
            await apiClient.patch(`/api/training/lessons/${lessonId}/`, {
                title: editTitle,
                content: editContent
            });
            toast.success("Lección actualizada");
            setIsEditDialogOpen(false);
            mutate(`/api/training/lessons/${lessonId}/`);
        } catch (error) {
            console.error("Error updating lesson:", error);
            toast.error("Error al actualizar la lección");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
    if (error || !lesson) return <div className="p-8 text-destructive">Error al cargar la lección</div>;

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => router.push(`/courses/${id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Curso
                </Button>

                <div className="flex items-center gap-2">
                    {isInstructor && (
                        <>
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => {
                                        setEditTitle(lesson.title);
                                        setEditContent(lesson.content || "");
                                    }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Editar Lección</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Título</Label>
                                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Contenido</Label>
                                            <Textarea
                                                value={editContent || ""}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={10}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleUpdateLesson} disabled={isSaving}>Guardar Cambios</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button variant="destructive" onClick={handleDeleteLesson}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                        </>
                    )}

                    {!isInstructor && (
                        isCompleted ? (
                            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50" onClick={handleUnmarkComplete}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completada
                            </Button>
                        ) : (
                            <Button onClick={handleMarkComplete}>
                                <Circle className="mr-2 h-4 w-4" />
                                Marcar como Completada
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* Lesson Content */}
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">{lesson.module_name}</p>
                            <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                        </div>
                        <Badge variant="secondary">{lesson.duration_minutes} min</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{lesson.content || "Sin contenido de texto."}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Resources Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Recursos y Materiales
                    </h2>
                    {isInstructor && (
                        <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Añadir Recurso
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Añadir Recurso a la Lección</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Nombre</Label>
                                        <Input
                                            value={resourceName}
                                            onChange={(e) => setResourceName(e.target.value)}
                                            placeholder="Ej: Diapositivas de la clase"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tipo</Label>
                                        <Select value={resourceType} onValueChange={(val: "FIL" | "URL") => setResourceType(val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FIL">Archivo</SelectItem>
                                                <SelectItem value="URL">Enlace / Video</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {resourceType === "FIL" ? (
                                        <div className="grid gap-2">
                                            <Label>Archivo</Label>
                                            <FileUpload
                                                onFileSelect={setResourceFile}
                                                accept="*/*"
                                                currentFile={resourceFile}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label>URL</Label>
                                            <Input
                                                value={resourceUrl}
                                                onChange={(e) => setResourceUrl(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsResourceDialogOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleUploadResource} disabled={isUploading}>Subir</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {lesson.resources && lesson.resources.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {lesson.resources.map((resource) => (
                            <Card key={resource.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                                            {resource.resource_type === 'FIL' ? (
                                                <FileText className="h-5 w-5 text-primary" />
                                            ) : (
                                                <ExternalLink className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium truncate">{resource.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {resource.resource_type === 'FIL' ? 'Archivo Adjunto' : 'Enlace Externo'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 shrink-0">
                                        {resource.resource_type === 'FIL' && resource.file_url ? (
                                            <Button size="icon" variant="ghost" asChild>
                                                <a href={resource.file_url} download target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        ) : resource.resource_type === 'URL' && resource.url ? (
                                            <Button size="icon" variant="ghost" asChild>
                                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        ) : null}

                                        {isInstructor && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleDeleteResource(resource.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        No hay recursos adicionales para esta lección.
                    </div>
                )}
            </div>
        </div>
    );
}
