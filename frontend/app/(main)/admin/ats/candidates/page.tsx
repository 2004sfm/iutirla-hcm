"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye, FileDown, Loader2, Search } from "lucide-react";
import { Candidate, CANDIDATE_STAGE_LABELS } from "@/types/ats";
import apiClient from "@/lib/apiClient";
import { CatalogHeader, type BreadcrumbItemType } from "@/components/CatalogHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Reclutamiento", href: "/admin/ats/jobs" },
    { name: "Candidatos", href: "/admin/ats/candidates" },
];

export default function CandidatesPage() {
    const router = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [stageFilter, setStageFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadCandidates();
    }, []);

    async function loadCandidates() {
        try {
            const res = await apiClient.get("/api/ats/candidates/");
            setCandidates(res.data.results || res.data);
        } catch (error) {
            console.error("Error loading candidates:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCandidates = candidates.filter((candidate) => {
        const matchesStage = stageFilter === "all" || candidate.stage === stageFilter;
        const matchesSearch =
            candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStage && matchesSearch;
    });

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
            <CatalogHeader items={breadcrumbItems} />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* Header Actions */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar candidatos..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={stageFilter} onValueChange={setStageFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por etapa" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las etapas</SelectItem>
                                {Object.entries(CANDIDATE_STAGE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vacante</TableHead>
                                <TableHead>Etapa</TableHead>
                                <TableHead>Fecha Aplicación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredCandidates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron candidatos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCandidates.map((candidate) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="font-medium">
                                            {candidate.first_name} {candidate.last_name}
                                        </TableCell>
                                        <TableCell>{candidate.email}</TableCell>
                                        <TableCell>
                                            {candidate.job_posting_title || `Vacante #${candidate.job_posting}`}
                                        </TableCell>
                                        <TableCell>{getStageBadge(candidate.stage)}</TableCell>
                                        <TableCell>
                                            {new Date(candidate.applied_date).toLocaleDateString("es-VE")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(candidate.cv_file, "_blank")}
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/ats/candidates/${candidate.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
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
        </>
    );
}
