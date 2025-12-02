"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, UserPlus, Trash2, Loader2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { ParticipantListItem, enrollmentStatusDisplay, academicStatusDisplay } from "@/types/course";
import { Combobox } from "@/components/ui/combobox";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

interface CoursePersonnelProps {
    courseId: string;
}

export default function CoursePersonnel({ courseId }: CoursePersonnelProps) {
    const [isProcessing, setIsProcessing] = useState<number | null>(null);

    // Dialog States
    const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
    const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    // Selection States
    const [selectedPersonId, setSelectedPersonId] = useState<string>("");
    const [activeRole, setActiveRole] = useState<'INS' | 'EST' | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    // Fetch list of all persons for selection
    const { data: persons } = useSWR<any[]>(
        `/api/core/persons/?page_size=1000`,
        fetcher
    );

    // Fetch current instructors to check count
    const { data: instructors } = useSWR<ParticipantListItem[]>(
        `/api/training/participants/?course=${courseId}&role=INS`,
        fetcher
    );

    // Fetch current students to check duplicates
    const { data: students } = useSWR<ParticipantListItem[]>(
        `/api/training/participants/?course=${courseId}&role=EST&enrollment_status=ENR`,
        fetcher
    );

    const hasInstructor = instructors && instructors.length > 0;

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
        setSelectedPersonId("");
        setActiveRole(null);
        setModalError(null);
    };

    const initiateAdd = (role: 'INS' | 'EST') => {
        setModalError(null);
        const personId = selectedPersonId;

        if (!personId) {
            setModalError("Por favor, selecciona una persona.");
            return;
        }

        // Validation Logic
        if (role === 'INS') {
            if (hasInstructor) {
                setModalError("Este curso ya tiene un instructor asignado.");
                return;
            }
            // Check if person is already a student
            if (students?.some(s => s.person_id === parseInt(personId))) {
                setModalError("Esta persona ya está inscrita como estudiante.");
                return;
            }
        }

        if (role === 'EST') {
            // Check if person is already an instructor
            if (instructors?.some(i => i.person_id === parseInt(personId))) {
                setModalError("Esta persona ya es instructor del curso.");
                return;
            }
            // Check if person is already a student
            if (students?.some(s => s.person_id === parseInt(personId))) {
                setModalError("Esta persona ya está inscrita en el curso.");
                return;
            }
        }

        setActiveRole(role);
        setIsConfirmDialogOpen(true);
    };

    // Add participant (instructor or student)
    const handleAddParticipant = async () => {
        if (!selectedPersonId || !activeRole) return;

        try {
            await apiClient.post(`/api/training/participants/`, {
                course: parseInt(courseId),
                person: parseInt(selectedPersonId),
                role: activeRole,
                enrollment_status: 'ENR'
            });

            toast.success(`${activeRole === 'INS' ? 'Instructor' : 'Estudiante'} agregado exitosamente`);

            // Refresh lists
            mutate(`/api/training/participants/?course=${courseId}&role=INS`);
            mutate(`/api/training/participants/?course=${courseId}&role=EST&enrollment_status=ENR`);

            handleCloseDialogs();
        } catch (error: any) {
            console.error("Error adding participant:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.person || "Error al agregar participante";
            setModalError(errorMsg);
            setIsConfirmDialogOpen(false); // Close confirm, keep main dialog open to show error
        }
    };

    // Remove participant (instructor or student)
    const handleRemove = async (participantId: number, role: string) => {
        setIsProcessing(participantId);
        try {
            await apiClient.delete(`/api/training/participants/${participantId}/`);

            if (role === 'INS') {
                toast.success("Instructor removido");
                mutate(`/api/training/participants/?course=${courseId}&role=INS`);
            } else {
                toast.success("Estudiante removido del curso");
                mutate(`/api/training/participants/?course=${courseId}&role=EST&enrollment_status=ENR`);
            }
        } catch (error: any) {
            console.error("Error removing participant:", error);
            toast.error(error.response?.data?.error || "Error al remover");
        } finally {
            setIsProcessing(null);
        }
    };

    const renderPersonPreview = (person: any, role: 'INS' | 'EST') => {
        if (!person) return null;
        return (
            <Card className="mt-4 border-dashed">
                <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="font-medium">{person.full_name}</p>
                        <p className="text-sm text-muted-foreground">{person.hiring_search}</p>
                        {person.primary_email && <p className="text-xs text-muted-foreground">{person.primary_email}</p>}
                    </div>
                    <Button onClick={() => initiateAdd(role)} className="w-full lg:w-auto">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </CardContent>
            </Card>
        );
    };

    // --- Catalog Configuration ---

    // Instructors
    const instructorFields: CatalogField[] = []; // No fields needed as we disable create/edit
    const instructorColumns: ColumnDef<any>[] = [
        { accessorKey: "person_name", header: "Nombre", cell: ({ row }) => row.getValue("person_name") },
        { accessorKey: "enrollment_status", header: "Estado", cell: ({ row }) => enrollmentStatusDisplay[row.original.enrollment_status as keyof typeof enrollmentStatusDisplay] || row.original.enrollment_status },
    ];

    // Students
    const studentFields: CatalogField[] = [];
    const studentColumns: ColumnDef<any>[] = [
        { accessorKey: "person_name", header: "Nombre", cell: ({ row }) => row.getValue("person_name") },
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
            {/* Instructors Section */}
            <div className="space-y-4">
                <CatalogCRUD
                    title="Instructores"
                    apiUrl={`/api/training/participants/?course=${courseId}&role=INS`}
                    fields={instructorFields}
                    columns={instructorColumns}
                    disableCreate={true}
                    disableEdit={true}
                    disablePagination={true}
                    customToolbarActions={
                        <Dialog open={isInstructorDialogOpen} onOpenChange={setIsInstructorDialogOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={hasInstructor} onClick={() => { setSelectedPersonId(""); setModalError(null); }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Instructor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Agregar Instructor</DialogTitle>
                                    <DialogDescription>
                                        Busca y selecciona una persona para asignarla como instructor.
                                        Solo se permite un instructor por curso.
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
                                    {renderPersonPreview(selectedPerson, 'INS')}
                                </div>
                            </DialogContent>
                        </Dialog>
                    }
                />
            </div>

            <Separator />

            {/* Students Section */}
            <div className="space-y-4">
                <CatalogCRUD
                    title="Estudiantes Inscritos"
                    apiUrl={`/api/training/participants/?course=${courseId}&role=EST&enrollment_status=ENR`}
                    fields={studentFields}
                    columns={studentColumns}
                    disableCreate={true}
                    disableEdit={true}
                    disableDelete={true} // Custom delete action
                    disablePagination={true} // Show all students
                    extraActions={(item) => (
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemove(item.id, 'EST')}
                            disabled={isProcessing === item.id}
                        >
                            {isProcessing === item.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Remover
                        </Button>
                    )}
                    customToolbarActions={
                        <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setSelectedPersonId(""); setModalError(null); }}>
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
                                    {renderPersonPreview(selectedPerson, 'EST')}
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
                        <AlertDialogTitle>¿Confirmar inscripción?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de inscribir a <strong>{selectedPerson?.full_name}</strong> como <strong>{activeRole === 'INS' ? 'Instructor' : 'Estudiante'}</strong> en este curso.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAddParticipant}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
