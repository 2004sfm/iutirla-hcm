"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    BookOpen,
    FileText,
    Lock,
    Calendar,
    Clock,
    ExternalLink,
    Download,
    ArrowLeft,
    Plus,
    MoreVertical,
    Trash2,
    Link as LinkIcon,
    Users,  // 🆕 NEW
    CheckCircle,  // 🆕 NEW
    XCircle,  // 🆕 NEW
} from "lucide-react";
import { CourseHeader } from "@/components/courses/course-header";
import { FileUpload } from "@/components/ui/file-upload";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";  // 🆕 NEW
import {
    Course,
    CourseSession,
    CourseResource,
    EnrollmentStatus,
    UserEnrollment,
    ParticipantListItem,
    LessonProgress,  // 🆕 NEW
} from "@/types/course";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { CourseModuleAccordion } from "@/components/courses/course-module-accordion";  // 🆕 NEW

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();



    // 🆕 NEW: Grading state (People tab)
    const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<ParticipantListItem | null>(null);
    const [finalGrade, setFinalGrade] = useState("");
    const [isGrading, setIsGrading] = useState(false);

    // 🆕 NEW: Content Creation State
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
    const [newModuleName, setNewModuleName] = useState("");
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [newLessonContent, setNewLessonContent] = useState("");
    const [newLessonDuration, setNewLessonDuration] = useState("");
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [isCreatingContent, setIsCreatingContent] = useState(false);

    // Fetch course details
    const { data: course, error, isLoading } = useSWR<Course>(
        `/api/training/courses/${id}/`,
        fetcher
    );

    // Fetch user enrollment status
    const { data: userEnrollment } = useSWR<UserEnrollment>(
        user?.person ? `/api/training/courses/${id}/my_enrollment/` : null,
        fetcher,
        {
            shouldRetryOnError: false,
            onError: () => {
                // 404 means no enrollment, which is expected
            },
        }
    );

    // 🆕 NEW: Fetch lesson progress (only if enrolled)
    const { data: lessonProgress, mutate: mutateProgress } = useSWR<LessonProgress[]>(
        userEnrollment?.enrollment_status === EnrollmentStatus.ENROLLED
            ? `/api/training/lesson-progress/?enrollment=${userEnrollment.id}`
            : null,
        fetcher
    );



    // 🆕 NEW: People tab handlers
    const handleApproveEnrollment = async (participantId: number) => {
        try {
            await apiClient.post(`/api/training/courses/${id}/approve_enrollment/`, {
                participant_id: participantId,
            });
            toast.success("Solicitud aprobada exitosamente");
            mutate(`/api/training/courses/${id}/`);
        } catch (error: any) {
            console.error("Error approving enrollment:", error);
            toast.error(error.response?.data?.error || "Error al aprobar la solicitud");
        }
    };

    const handleRejectEnrollment = async (participantId: number) => {
        if (!confirm("¿Estás seguro de rechazar esta solicitud?")) {
            return;
        }

        try {
            await apiClient.post(`/api/training/courses/${id}/reject_enrollment/`, {
                participant_id: participantId,
            });
            toast.success("Solicitud rechazada");
            mutate(`/api/training/courses/${id}/`);
        } catch (error: any) {
            console.error("Error rejecting enrollment:", error);
            toast.error(error.response?.data?.error || "Error al rechazar la solicitud");
        }
    };

    const handleAssignGrade = async () => {
        if (!selectedParticipant) return;

        const gradeNum = parseFloat(finalGrade);
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20) {
            toast.error("La nota debe ser un número entre 0 y 20");
            return;
        }

        setIsGrading(true);
        try {
            await apiClient.post(`/api/training/participants/${selectedParticipant.id}/assign_grade/`, {
                final_grade: gradeNum,
            });
            toast.success("Nota asignada exitosamente");
            setIsGradingDialogOpen(false);
            setSelectedParticipant(null);
            setFinalGrade("");
            mutate(`/api/training/courses/${id}/`);
        } catch (error: any) {
            console.error("Error assigning grade:", error);
            toast.error(error.response?.data?.error || "Error al asignar la nota");
        } finally {
            setIsGrading(false);
        }
    };

    // 🆕 NEW: Content Creation Handlers
    const handleCreateModule = async () => {
        if (!newModuleName.trim()) {
            toast.error("El nombre del módulo es obligatorio");
            return;
        }

        setIsCreatingContent(true);
        try {
            await apiClient.post(`/api/training/modules/`, {
                course: id,
                name: newModuleName,
                order: (course?.modules?.length || 0) + 1
            });
            toast.success("Módulo creado exitosamente");
            setIsCreateModuleOpen(false);
            setNewModuleName("");
            mutate(`/api/training/courses/${id}/`);
        } catch (error: any) {
            console.error("Error creating module:", error);
            toast.error("Error al crear el módulo");
        } finally {
            setIsCreatingContent(false);
        }
    };

    const handleCreateLesson = async () => {
        if (!selectedModuleId || !newLessonTitle) return;
        setIsCreatingContent(true);
        try {
            const formData = new FormData();
            formData.append('module', selectedModuleId.toString());
            formData.append('title', newLessonTitle);
            formData.append('duration_minutes', newLessonDuration || "0");
            formData.append('order', "99"); // Backend handles order

            if (newLessonContent) formData.append('content', newLessonContent);

            await apiClient.post("/api/training/lessons/", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success("Lección creada exitosamente");
            setIsCreateLessonOpen(false);
            setNewLessonTitle("");
            setNewLessonContent("");
            setNewLessonDuration("");
            mutate(`/api/training/courses/${id}/`);
        } catch (error: any) {
            console.error("Error creating lesson:", error);
            toast.error("Error al crear la lección");
        } finally {
            setIsCreatingContent(false);
        }
    };

    // 🆕 NEW: Module Edit/Delete Handlers
    const handleUpdateModule = async (moduleId: number, newName: string) => {
        try {
            await apiClient.patch(`/api/training/modules/${moduleId}/`, {
                name: newName
            });
            toast.success("Módulo actualizado");
            mutate(`/api/training/courses/${id}/`);
        } catch (error) {
            console.error("Error updating module:", error);
            toast.error("Error al actualizar el módulo");
        }
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!confirm("¿Estás seguro de eliminar este módulo y todas sus lecciones?")) return;
        try {
            await apiClient.delete(`/api/training/modules/${moduleId}/`);
            toast.success("Módulo eliminado");
            mutate(`/api/training/courses/${id}/`);
        } catch (error) {
            console.error("Error deleting module:", error);
            toast.error("Error al eliminar el módulo");
        }
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

    // Determinar si el usuario está inscrito (enrolled) o es instructor
    const isEnrolled = userEnrollment?.enrollment_status === EnrollmentStatus.ENROLLED;
    const isInstructor = user?.person?.id === course.instructor_id || user?.is_staff;
    const hasAccess = isEnrolled || isInstructor;

    return (
        <div className="flex flex-col space-y-6 p-8">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="w-fit">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cursos
            </Button>

            {/* Course Header */}
            <CourseHeader course={course} />

            {/* Tabs: Overview, Resources & Modules */}
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
                        {!hasAccess && <Lock className="ml-2 h-4 w-4" />}
                    </TabsTrigger>
                    {isInstructor && (
                        <TabsTrigger
                            value="people"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 transition-all duration-300"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Personas
                        </TabsTrigger>
                    )}
                </TabsList>

                <div className="flex-1 mt-6">
                    {/* People Tab (Instructors Only) */}
                    {isInstructor && (
                        <TabsContent value="people" className="m-0 space-y-6">
                            {/* Pending Requests */}
                            {course.students?.some(s => s.enrollment_status === EnrollmentStatus.REQUESTED) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center">
                                            <Clock className="mr-2 h-5 w-5 text-orange-500" />
                                            Solicitudes Pendientes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Documento</TableHead>
                                                    <TableHead>Fecha Solicitud</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {course.students
                                                    ?.filter(s => s.enrollment_status === EnrollmentStatus.REQUESTED)
                                                    .map((student) => (
                                                        <TableRow key={student.id}>
                                                            <TableCell className="font-medium">{student.person_name}</TableCell>
                                                            <TableCell>{student.person_id_document || "N/A"}</TableCell>
                                                            <TableCell>
                                                                {new Date().toLocaleDateString()} {/* TODO: Add created_at to API */}
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                                    onClick={() => handleApproveEnrollment(student.id)}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    Aprobar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleRejectEnrollment(student.id)}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" />
                                                                    Rechazar
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Enrolled Students */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold flex items-center">
                                        <Users className="mr-2 h-5 w-5 text-blue-500" />
                                        Estudiantes Inscritos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Documento</TableHead>
                                                <TableHead>Estado Académico</TableHead>
                                                <TableHead>Nota Final</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {course.students
                                                ?.filter(s => s.enrollment_status === EnrollmentStatus.ENROLLED)
                                                .map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-medium">{student.person_name}</TableCell>
                                                        <TableCell>{student.person_id_document || "N/A"}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                student.academic_status === 'APR' || student.academic_status === 'COM' ? "default" :
                                                                    student.academic_status === 'REP' ? "destructive" : "secondary"
                                                            }>
                                                                {student.academic_status_name}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {student.grade !== undefined && student.grade !== null ? (
                                                                <span className="font-bold">{student.grade}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">Sin nota</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {course.requires_approval_to_complete && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedParticipant(student);
                                                                        setFinalGrade(student.grade?.toString() || "");
                                                                        setIsGradingDialogOpen(true);
                                                                    }}
                                                                >
                                                                    Evaluar
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {(!course.students || course.students.filter(s => s.enrollment_status === EnrollmentStatus.ENROLLED).length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No hay estudiantes inscritos en este curso.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                        </TabsContent>
                    )}
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
                        </div>
                    </TabsContent>



                    {/* Modules Tab */}
                    <TabsContent value="modules" className="m-0">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                                    <div className="flex items-center">
                                        <BookOpen className="mr-2 h-5 w-5 text-primary" />
                                        Contenido del Curso
                                    </div>
                                    {/* Progress Bar */}
                                    {isEnrolled && lessonProgress && (
                                        <div className="flex items-center text-sm font-normal text-muted-foreground">
                                            <span className="mr-2">Tu Progreso:</span>
                                            <Badge variant="outline">
                                                {Math.round((lessonProgress.filter(p => p.completed).length / (course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1)) * 100)}%
                                            </Badge>
                                        </div>
                                    )}
                                </CardTitle>
                                {/* 🆕 NEW: Instructor Actions */}
                                {isInstructor && (
                                    <div className="flex gap-2 mt-4">
                                        <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Nuevo Módulo
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Crear Nuevo Módulo</DialogTitle>
                                                    <DialogDescription>Agrupa tus lecciones en módulos.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Nombre del Módulo</Label>
                                                        <Input
                                                            value={newModuleName}
                                                            onChange={(e) => setNewModuleName(e.target.value)}
                                                            placeholder="Ej: Módulo 1: Introducción"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>Cancelar</Button>
                                                    <Button onClick={handleCreateModule} disabled={isCreatingContent}>Crear Módulo</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Nueva Lección
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Crear Nueva Lección</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Módulo</Label>
                                                        <Select
                                                            onValueChange={(val) => setSelectedModuleId(parseInt(val))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona un módulo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {course.modules?.map((m) => (
                                                                    <SelectItem key={m.id} value={m.id.toString()}>
                                                                        {m.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Título de la Lección</Label>
                                                        <Input
                                                            value={newLessonTitle}
                                                            onChange={(e) => setNewLessonTitle(e.target.value)}
                                                            placeholder="Ej: Historia de la Seguridad"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Duración (minutos)</Label>
                                                        <Input
                                                            type="number"
                                                            value={newLessonDuration}
                                                            onChange={(e) => setNewLessonDuration(e.target.value)}
                                                            placeholder="Ej: 45"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Contenido (Texto)</Label>
                                                        <Input
                                                            value={newLessonContent}
                                                            onChange={(e) => setNewLessonContent(e.target.value)}
                                                            placeholder="Texto o descripción breve"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsCreateLessonOpen(false)}>Cancelar</Button>
                                                    <Button onClick={handleCreateLesson} disabled={isCreatingContent}>Crear Lección</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {hasAccess ? (
                                    <div className="space-y-8">
                                        {/* 🆕 NEW: Hierarchical Content */}
                                        <CourseModuleAccordion
                                            modules={course.modules || []}
                                            progress={lessonProgress}
                                            onLessonComplete={() => {
                                                mutateProgress();
                                                mutate(`/api/training/courses/${id}/my_enrollment/`); // Update overall status
                                            }}
                                            isInstructor={isInstructor}
                                            onUpdateModule={handleUpdateModule}
                                            onDeleteModule={handleDeleteModule}
                                        />

                                        {/* Legacy Sessions (Attendance) */}
                                        {course.sessions && course.sessions.length > 0 && (
                                            <div className="mt-8 pt-8 border-t">
                                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                    <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                                                    Sesiones Programadas (Asistencia)
                                                </h3>
                                                <div className="space-y-4">
                                                    {course.sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <div className="bg-primary/10 p-2 rounded-full">
                                                                    <Calendar className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium">{session.topic}</h4>
                                                                    <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                                                                        <span className="flex items-center">
                                                                            <Calendar className="h-3 w-3 mr-1" />
                                                                            {new Date(session.date).toLocaleDateString()}
                                                                        </span>
                                                                        <span className="flex items-center">
                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <div className="bg-muted p-4 rounded-full">
                                            <Lock className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Contenido Bloqueado</h3>
                                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                                Debes estar inscrito en este curso para acceder a los módulos y lecciones.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
