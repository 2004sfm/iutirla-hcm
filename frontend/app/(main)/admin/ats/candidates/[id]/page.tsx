"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Loader2,
    FileDown,
    Mail,
    Phone,
    IdCard,
    Calendar,
    Briefcase,
    GraduationCap,
    Link as LinkIcon,
    Trash2,
    Pencil,
} from "lucide-react";
import Link from "next/link";
import { Candidate, CANDIDATE_STAGE_LABELS } from "@/types/ats";
import apiClient from "@/lib/apiClient";
import { CatalogHeader } from "@/components/CatalogHeader";
import { CandidateTimeline } from "@/components/ats/CandidateTimeline";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editData, setEditData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_subscriber: "",
    });
    const [newAvatar, setNewAvatar] = useState<File | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (candidate) {
            setEditData({
                first_name: candidate.first_name,
                last_name: candidate.last_name,
                email: candidate.email,
                phone_subscriber: candidate.phone_subscriber || "",
            });
        }
    }, [candidate]);

    useEffect(() => {
        if (params.id) {
            loadCandidate();
        }
    }, [params.id]);

    async function loadCandidate() {
        try {
            const res = await apiClient.get(`/api/ats/candidates/${params.id}/`);
            setCandidate(res.data);
        } catch (error) {
            console.error("Error loading candidate:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setActionLoading(true);
        try {
            await apiClient.delete(`/api/ats/candidates/${params.id}/`);
            toast.success("Candidato eliminado correctamente");
            router.push("/admin/ats/candidates");
        } catch (error) {
            console.error("Error deleting candidate:", error);
            toast.error("Error al eliminar candidato");
        } finally {
            setActionLoading(false);
            setShowDeleteDialog(false);
        }
    }

    async function handleUpdate() {
        setActionLoading(true);
        try {
            if (newAvatar) {
                const formData = new FormData();
                formData.append("first_name", editData.first_name);
                formData.append("last_name", editData.last_name);
                formData.append("email", editData.email);
                if (editData.phone_subscriber) formData.append("phone_subscriber", editData.phone_subscriber);
                formData.append("avatar", newAvatar);

                await apiClient.patch(`/api/ats/candidates/${params.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await apiClient.patch(`/api/ats/candidates/${params.id}/`, editData);
            }

            toast.success("Candidato actualizado correctamente");
            loadCandidate();
            setShowEditDialog(false);
            setNewAvatar(null);
        } catch (error) {
            console.error("Error updating candidate:", error);
            toast.error("Error al actualizar candidato");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <h2 className="text-2xl font-bold">Candidato no encontrado</h2>
                <Link href="/admin/ats/candidates">
                    <Button variant="outline">Volver al listado</Button>
                </Link>
            </div>
        );
    }

    const getStageBadge = (stage: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            NEW: "secondary",
            SCR: "outline",
            INT: "default",
            OFF: "default",
            FIN: "default",
            REJ: "destructive",
            HIR: "default",
        };
        return (
            <Badge variant={variants[stage] || "outline"}>
                {CANDIDATE_STAGE_LABELS[stage as keyof typeof CANDIDATE_STAGE_LABELS]}
            </Badge>
        );
    };

    return (
        <>
            <div className="flex h-full flex-col overflow-hidden">
                <CatalogHeader
                    items={[
                        { name: "ATS", href: "/admin/ats/candidates" },
                        { name: "Candidatos", href: "/admin/ats/candidates" },
                        { name: `${candidate.first_name} ${candidate.last_name}`, href: "" },
                    ]}
                />

                <div className="flex-1 overflow-y-auto scroll-smooth">
                    <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">
                        {/* Header con botón de descarga */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {candidate.avatar ? (
                                    <img
                                        src={candidate.avatar}
                                        alt={`${candidate.first_name} ${candidate.last_name}`}
                                        className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xl font-bold">
                                        {candidate.first_name[0]}{candidate.last_name[0]}
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold">
                                        {candidate.first_name} {candidate.last_name}
                                    </h1>
                                    <p className="text-muted-foreground">Detalle del candidato</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditDialog(true)}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(candidate.cv_url || candidate.cv_file, "_blank")}
                                    disabled={!candidate.cv_url && !candidate.cv_file}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Descargar CV
                                </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                                <TabsTrigger value="details">Detalles</TabsTrigger>
                                <TabsTrigger value="cv" disabled={!candidate.cv_url && !candidate.cv_file}>
                                    Vista Previa CV
                                </TabsTrigger>
                                <TabsTrigger value="history">Historial</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="mt-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    {/* Información Personal */}
                                    <Card className="md:col-span-2">
                                        <CardHeader>
                                            <CardTitle>Información Personal</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="flex items-start gap-3">
                                                    <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Email</p>
                                                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Teléfono</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {candidate.phone_area_code?.code && candidate.phone_subscriber
                                                                ? `${candidate.phone_area_code.code}-${candidate.phone_subscriber}`
                                                                : candidate.phone || "No especificado"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <IdCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Cédula/ID</p>
                                                        <p className="text-sm text-muted-foreground">{candidate.national_id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Fecha de Aplicación</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(candidate.created_at).toLocaleDateString("es-VE", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Información de Vacante */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Vacante</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <Briefcase className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Aplicó a</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {candidate.job_posting_title || `Vacante #${candidate.job_posting}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="mb-2 text-sm font-medium">Etapa Actual</p>
                                                {getStageBadge(candidate.stage)}
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() =>
                                                    router.push(`/admin/ats/jobs/${candidate.job_posting}/candidates`)
                                                }
                                            >
                                                Ver Pipeline
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Educación */}
                                    {candidate.education && candidate.education.length > 0 && (
                                        <Card className="md:col-span-2">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <GraduationCap className="h-5 w-5" />
                                                    Educación
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {candidate.education.map((edu, index) => (
                                                        <div key={edu.id} className="rounded-lg border p-4">
                                                            <h4 className="font-semibold">{edu.school_name}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {edu.level_name} en {edu.field_name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {new Date(edu.start_date).getFullYear()} -{" "}
                                                                {edu.end_date ? new Date(edu.end_date).getFullYear() : "Presente"}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="cv" className="mt-6">
                                <Card className="h-[800px]">
                                    <CardContent className="p-0 h-full">
                                        {(candidate.cv_url || candidate.cv_file) ? (
                                            <iframe
                                                src={candidate.cv_url || candidate.cv_file}
                                                className="w-full h-full rounded-lg"
                                                title="CV Preview"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                                No hay CV disponible para previsualizar
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="history" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Historial de Actividad</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CandidateTimeline candidateId={candidate.id} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Diálogo de Edición */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Candidato</DialogTitle>
                        <DialogDescription>
                            Modifica los datos básicos del candidato.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="first_name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="first_name"
                                value={editData.first_name}
                                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="last_name" className="text-right">
                                Apellido
                            </Label>
                            <Input
                                id="last_name"
                                value={editData.last_name}
                                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                value={editData.email}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Teléfono
                            </Label>
                            <Input
                                id="phone"
                                value={editData.phone_subscriber}
                                onChange={(e) => setEditData({ ...editData, phone_subscriber: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="avatar" className="text-right">
                                Avatar
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setNewAvatar(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de Eliminación */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al candidato y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
