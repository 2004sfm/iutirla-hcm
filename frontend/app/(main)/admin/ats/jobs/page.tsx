"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Edit, Trash2, Loader2, Search } from "lucide-react";
import { JobPosting, JOB_STATUS_LABELS } from "@/types/ats";
import apiClient from "@/lib/apiClient";
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Reclutamiento", href: "/admin/ats/jobs" },
    { name: "Vacantes", href: "/admin/ats/jobs" },
];

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        try {
            const res = await apiClient.get("/api/ats/jobs/");
            setJobs(res.data.results || res.data);
        } catch (error) {
            console.error("Error loading jobs:", error);
        } finally {
            setLoading(false);
        }
    }

    function confirmDelete(id: number) {
        setJobToDelete(id);
        setShowDeleteDialog(true);
    }

    async function handleDelete() {
        if (!jobToDelete) return;

        setShowDeleteDialog(false);
        const toastId = toast.loading('Eliminando vacante...');
        try {
            await apiClient.delete(`/api/ats/jobs/${jobToDelete}/`);
            toast.success('Vacante eliminada exitosamente', { id: toastId });
            await loadJobs();
        } catch (error) {
            toast.error('Error al eliminar la vacante', { id: toastId });
        } finally {
            setJobToDelete(null);
        }
    }

    const filteredJobs = jobs.filter((job) => {
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        const matchesSearch =
            searchTerm === "" ||
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.position_title?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            DRAFT: "secondary",
            PUBLISHED: "default",
            CLOSED: "destructive",
            FROZEN: "outline",
        };
        return (
            <Badge variant={variants[status] || "default"}>
                {JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS]}
            </Badge>
        );
    };

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* Header Actions */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar vacantes..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="DRAFT">Borrador</SelectItem>
                                <SelectItem value="PUBLISHED">Publicada</SelectItem>
                                <SelectItem value="CLOSED">Cerrada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => router.push("/admin/ats/jobs/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Vacante
                    </Button>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Posición</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Candidatos</TableHead>
                                <TableHead>Fecha Publicación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredJobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No se encontraron vacantes
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredJobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.position_title}</TableCell>
                                        <TableCell>{job.department_name || "-"}</TableCell>
                                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                                        <TableCell>{job.candidates_count || 0}</TableCell>
                                        <TableCell>
                                            {job.published_date
                                                ? new Date(job.published_date).toLocaleDateString("es-VE")
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/ats/jobs/${job.id}`)}
                                                    title="Editar vacante"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/ats/jobs/${job.id}/candidates`)}
                                                    title="Ver candidatos"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => confirmDelete(job.id)}
                                                    title="Eliminar vacante"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* AlertDialog para Eliminar */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar vacante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La vacante y todos sus candidatos asociados serán eliminados permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
