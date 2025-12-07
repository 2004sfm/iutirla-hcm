"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Trash2, Loader2, Plus, AlertCircle, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { Course, ParticipantListItem, enrollmentStatusDisplay, academicStatusDisplay } from "@/types/course";
import { Combobox } from "@/components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil } from "lucide-react";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable } from "@/components/catalogs/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

interface CoursePersonnelProps {
    courseId: string;
}

export default function CoursePersonnel({ courseId }: CoursePersonnelProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Dialog States
    const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
    const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isRemoveInstructorDialogOpen, setIsRemoveInstructorDialogOpen] = useState(false);
    const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<ParticipantListItem | null>(null);
    const [gradeValue, setGradeValue] = useState<string>("");

    // Refresh key for students list (CatalogCRUD)
    const [studentsRefreshKey, setStudentsRefreshKey] = useState(0);

    // Selection States
    const [selectedPersonId, setSelectedPersonId] = useState<string>("");
    const [isForInstructor, setIsForInstructor] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    // 🔧 REFACTOR: Fetch course to get instructor
    const { data: course, mutate: mutateCourse } = useSWR<Course>(
        `/api/training/courses/${courseId}/`,
        fetcher
    );

    // Fetch list of all persons for selection
    const { data: persons } = useSWR<any[]>(
        `/api/core/persons/?page_size=1000`,
        fetcher
    );

    // 🔧 REFACTOR: Fetch only students (no more role parameter)
    // Note: We use this just for validation checks, CatalogCRUD fetches its own data
    const { data: students, mutate: mutateStudents } = useSWR<ParticipantListItem[]>(
        `/api/training/participants/?course=${courseId}&enrollment_status=ENR`,
        fetcher
    );

    const instructor = course?.instructor_id ? {
        id: course.instructor_id,
        name: course.instructor_name,
        person_id_document: course.instructor_id_document
    } : null;

    const instructorData = instructor ? [instructor] : [];

    // Prepare person options for combobox
    const personOptions = persons?.map(p => ({
        value: p.id.toString(),
        label: p.hiring_search || p.full_name
    })) || [];

    const getSelectedPersonDetails = (id: string) => {
        return persons?.find(p => p.id.toString() === id);
    };

    const selectedPerson = getSelectedPersonDetails(selectedPersonId);

    // Reset states when dialogs close
    const handleCloseDialogs = () => {
        setIsInstructorDialogOpen(false);
        setIsStudentDialogOpen(false);
        setIsConfirmDialogOpen(false);
        setIsRemoveInstructorDialogOpen(false);
        setIsGradeDialogOpen(false);
        setSelectedPersonId("");
        setIsForInstructor(false);
        setSelectedParticipant(null);
        setGradeValue("");
        setModalError(null);
    };

    const initiateAddInstructor = () => {
        setModalError(null);
        const personId = selectedPersonId;

        if (!personId) {
            setModalError("Por favor, selecciona una persona.");
            return;
        }

        // Check if person is already a student
        if (students?.some(s => s.person_id === parseInt(personId))) {
            setModalError("Esta persona ya está inscrita como estudiante.");
            return;
        }

        setIsForInstructor(true);
        setIsConfirmDialogOpen(true);
    };

    const initiateAddStudent = () => {
        setModalError(null);
        const personId = selectedPersonId;

        if (!personId) {
            setModalError("Por favor, selecciona una persona.");
            return;
        }

        // Check if person is the instructor
        if (instructor && instructor.id === parseInt(personId)) {
            setModalError("Esta persona ya es instructor del curso.");
            return;
        }

        // Check if person is already a student
        if (students?.some(s => s.person_id === parseInt(personId))) {
            setModalError("Esta persona ya está inscrita en el curso.");
            return;
        }

        setIsForInstructor(false);
        setIsConfirmDialogOpen(true);
    };

    // 🔧 REFACTOR: Add/change instructor with PATCH to course
    const handleAddInstructor = async () => {
        if (!selectedPersonId) return;

        setIsProcessing(true);
        try {
            await apiClient.patch(`/api/training/courses/${courseId}/`, {
                instructor: parseInt(selectedPersonId)
            });

            toast.success(instructor ? "Instructor cambiado exitosamente" : "Instructor asignado exitosamente");
            await mutateCourse(); // Refresh course data
            handleCloseDialogs();
        } catch (error: any) {
            // ... (error handling same)
            let errorMsg = "Error al asignar instructor";
            if (error.response?.data) {
                const data = error.response.data;
                if (data.instructor) {
                    errorMsg = Array.isArray(data.instructor) ? data.instructor[0] : data.instructor;
                } else if (data.error) {
                    errorMsg = data.error;
                } else if (data.detail) {
                    errorMsg = data.detail;
                }
            }
            setModalError(errorMsg);
            setIsConfirmDialogOpen(false);
        } finally {
            setIsProcessing(false);
        }
    };

    // Add student as participant
    const handleAddStudent = async () => {
        if (!selectedPersonId) return;

        setIsProcessing(true);
        try {
            await apiClient.post(`/api/training/participants/`, {
                course: parseInt(courseId),
                person: parseInt(selectedPersonId),
                enrollment_status: 'ENR'
            });

            toast.success("Estudiante agregado exitosamente");
            // Trigger refresh of CatalogCRUD and local SWR cache
            setStudentsRefreshKey(prev => prev + 1);
            await mutateStudents();
            handleCloseDialogs();
        } catch (error: any) {
            // ... (error handling same)
            let errorMsg = "Error al agregar estudiante";
            if (error.response?.data) {
                const data = error.response.data;
                if (data.person) {
                    errorMsg = Array.isArray(data.person) ? data.person[0] : data.person;
                } else if (data.course) {
                    errorMsg = Array.isArray(data.course) ? data.course[0] : data.course;
                } else if (data.error) {
                    errorMsg = data.error;
                } else if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.non_field_errors) {
                    errorMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                }
            }
            setModalError(errorMsg);
            setIsConfirmDialogOpen(false);
        } finally {
            setIsProcessing(false);
        }
    };

    // 🔧 REFACTOR: Remove instructor with PATCH to course
    const handleRemoveInstructor = async () => {
        setIsProcessing(true);
        try {
            await apiClient.patch(`/api/training/courses/${courseId}/`, {
                instructor: null
            });

            toast.success("Instructor removido");
            await mutateCourse(); // Refresh course data
            setIsRemoveInstructorDialogOpen(false);
        } catch (error: any) {
            // console.error("Error removing instructor:", error);
            toast.error("Error al remover instructor");
        } finally {
            setIsProcessing(false);
        }
    };

    // Remove student participant
    const handleRemoveStudent = async (participantId: number) => {
        setIsProcessing(true);
        try {
            await apiClient.delete(`/api/training/participants/${participantId}/`);
            toast.success("Estudiante removido del curso");
            // Trigger refresh of CatalogCRUD and local SWR cache
            setStudentsRefreshKey(prev => prev + 1);
            await mutateStudents();
        } catch (error: any) {
            // console.error("Error removing student:", error);
            toast.error(error.response?.data?.error || "Error al remover");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderPersonPreview = (person: any) => {
        if (!person) return null;
        return (
            <Card className="mt-4 border-dashed">
                <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="font-medium">{person.full_name}</p>
                        <p className="text-sm text-muted-foreground">{person.hiring_search}</p>
                        {person.primary_email && <p className="text-xs text-muted-foreground">{person.primary_email}</p>}
                    </div>
                    <Button
                        onClick={() => isForInstructor ? initiateAddInstructor() : initiateAddStudent()}
                        className="w-full lg:w-auto"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Agregar
                    </Button>
                </CardContent>
            </Card>
        );
    };

    // --- Columns Configuration ---

    // Instructor Columns
    const instructorColumns: ColumnDef<any>[] = [
        { accessorKey: "name", header: "Nombre" },
        { accessorKey: "person_id_document", header: "Cédula", cell: ({ row }) => row.original.person_id_document || "S/C" },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => { setSelectedPersonId(""); setModalError(null); setIsForInstructor(true); setIsInstructorDialogOpen(true); }}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Cambiar Instructor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setIsRemoveInstructorDialogOpen(true)}
                                disabled={isProcessing}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover Instructor
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    // Handle grade assignment
    const handleAssignGrade = async () => {
        if (!selectedParticipant) return;
        const grade = parseFloat(gradeValue);

        if (isNaN(grade) || grade < 0 || grade > 20) {
            setModalError("La nota debe ser un número entre 0 y 20");
            return;
        }

        setIsProcessing(true);
        try {
            await apiClient.post(`/api/training/participants/${selectedParticipant.id}/assign_grade/`, {
                final_grade: grade
            });

            toast.success("Nota asignada exitosamente");
            setStudentsRefreshKey(prev => prev + 1);
            await mutateStudents();
            handleCloseDialogs();
        } catch (error: any) {
            let errorMsg = "Error al asignar nota";
            if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }
            setModalError(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    // Student Columns
    const studentFields: CatalogField[] = [];
    const studentColumns: ColumnDef<any>[] = [
        { accessorKey: "person_name", header: "Nombre", cell: ({ row }) => row.getValue("person_name") },
        { accessorKey: "person_id_document", header: "Cédula", cell: ({ row }) => row.original.person_id_document || "S/C" },
        {
            accessorKey: "academic_status",
            header: "Estado Académico",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {academicStatusDisplay[row.original.academic_status as keyof typeof academicStatusDisplay] || row.original.academic_status}
                </Badge>
            )
        },
        {
            accessorKey: "grade",
            header: "Nota",
            cell: ({ row }) => row.original.grade ? <Badge variant="secondary">Nota: {row.original.grade}/20</Badge> : "-"
        },
    ];

    return (
        <div className="space-y-8">
            {/* Instructor Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Instructor</h2>
                    {!instructor && (
                        <Dialog open={isInstructorDialogOpen} onOpenChange={setIsInstructorDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setSelectedPersonId(""); setModalError(null); setIsForInstructor(true); }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Asignar Instructor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Asignar Instructor</DialogTitle>
                                    <DialogDescription>
                                        Busca y selecciona una persona para asignarla como instructor.
                                    </DialogDescription>
                                </DialogHeader>

                                {modalError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{modalError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="py-4">
                                    <Combobox
                                        options={personOptions}
                                        value={selectedPersonId}
                                        onSelect={(val) => { setSelectedPersonId(val.toString()); setModalError(null); }}
                                        placeholder="Buscar por cédula..."
                                        emptyText="No se encontraron personas"
                                    />
                                    {renderPersonPreview(selectedPerson)}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <DataTable
                    columns={instructorColumns}
                    data={instructorData}
                    disablePagination={true}
                />
            </div>

            <Separator />

            {/* Students Section */}
            <div className="space-y-4">
                <CatalogCRUD
                    title="Estudiantes Inscritos"
                    apiUrl={`/api/training/participants/?course=${courseId}&enrollment_status=ENR`}
                    fields={studentFields}
                    columns={studentColumns}
                    disableCreate={true}
                    disableEdit={true}
                    disableDelete={true}
                    disablePagination={true}
                    refreshKey={studentsRefreshKey} // Pass refresh key
                    extraActions={(item) => (
                        <>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
                                    setSelectedParticipant(item);
                                    setGradeValue(item.grade?.toString() || "");
                                    setModalError(null);
                                    setIsGradeDialogOpen(true);
                                }}
                                disabled={isProcessing}
                            >
                                <GraduationCap className="mr-2 h-4 w-4" />
                                {item.grade ? "Editar Nota" : "Asignar Nota"}
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveStudent(item.id)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Remover
                            </Button>
                        </>
                    )}
                    customToolbarActions={
                        <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setSelectedPersonId(""); setModalError(null); setIsForInstructor(false); }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Estudiante
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Agregar Estudiante</DialogTitle>
                                    <DialogDescription>
                                        Busca y selecciona una persona para inscribirla como estudiante.
                                    </DialogDescription>
                                </DialogHeader>

                                {modalError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{modalError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="py-4">
                                    <Combobox
                                        options={personOptions}
                                        value={selectedPersonId}
                                        onSelect={(val) => { setSelectedPersonId(val.toString()); setModalError(null); }}
                                        placeholder="Buscar estudiante por cédula..."
                                        emptyText="No se encontraron personas"
                                    />
                                    {renderPersonPreview(selectedPerson)}
                                </div>
                            </DialogContent>
                        </Dialog>
                    }
                />
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de {isForInstructor ?
                                (instructor ? "cambiar el instructor" : "asignar a") :
                                "inscribir a"} {' '}
                            <strong>{selectedPerson?.full_name}</strong>
                            {isForInstructor ? " como instructor" : " como estudiante"} en este curso.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)} disabled={isProcessing}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={isForInstructor ? handleAddInstructor : handleAddStudent}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Instructor Dialog */}
            <AlertDialog open={isRemoveInstructorDialogOpen} onOpenChange={setIsRemoveInstructorDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Remover instructor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de remover a <strong>{instructor?.name}</strong> como instructor de este curso.
                            Esta acción puede revertirse asignando un nuevo instructor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveInstructor} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Grade Assignment Dialog */}
            <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Asignar Nota Final</DialogTitle>
                        <DialogDescription>
                            Asigna la nota final para {selectedParticipant?.person_name}
                        </DialogDescription>
                    </DialogHeader>

                    {modalError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{modalError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="grade">Nota (0-20)</Label>
                            <Input
                                id="grade"
                                type="number"
                                min="0"
                                max="20"
                                step="0.01"
                                value={gradeValue}
                                onChange={(e) => { setGradeValue(e.target.value); setModalError(null); }}
                                placeholder="Ingrese la nota"
                            />
                        </div>
                        {selectedParticipant?.grade && (
                            <p className="text-sm text-muted-foreground">
                                Nota actual: <strong>{selectedParticipant.grade}/20</strong>
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)} disabled={isProcessing}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAssignGrade} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Asignar Nota
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
