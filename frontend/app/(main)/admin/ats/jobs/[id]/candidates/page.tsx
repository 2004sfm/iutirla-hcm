"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Eye, UserCheck, Users, Search } from "lucide-react";
import Link from "next/link";
import { Candidate, JobPosting, CANDIDATE_STAGE_LABELS, CandidateStage } from "@/types/ats";
import { CatalogHeader } from "@/components/CatalogHeader";

import apiClient from "@/lib/apiClient";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    closestCorners,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableCandidateCard, DroppableColumn, CandidateCard } from "@/components/ats/KanbanComponents";
import { toast } from "sonner";

const STAGE_ORDER: CandidateStage[] = ["NEW", "REV", "INT", "OFF", "POOL"];

export default function JobCandidatesPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [changingStage, setChangingStage] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [newStage, setNewStage] = useState<CandidateStage | "">("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeId, setActiveId] = useState<number | null>(null);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [confirmMoveDialogOpen, setConfirmMoveDialogOpen] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ candidate: Candidate; stage: CandidateStage } | null>(null);
    const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
    const [interviewingCandidate, setInterviewingCandidate] = useState<Candidate | null>(null);
    const [interviewData, setInterviewData] = useState({ date: "", time: "", notes: "" });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        if (params.id) {
            loadData();
        }
    }, [params.id]);

    async function loadData() {
        try {
            const [jobRes, candidatesRes] = await Promise.all([
                apiClient.get(`/api/ats/jobs/${params.id}/`),
                apiClient.get(`/api/ats/candidates/?job_posting=${params.id}`),
            ]);

            setJob(jobRes.data);
            setCandidates(candidatesRes.data.results || candidatesRes.data);
            setNextPage(candidatesRes.data.next);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function changeStage(candidate: Candidate, stage: CandidateStage) {
        setChangingStage(true);
        try {
            await apiClient.post(
                `/api/ats/candidates/${candidate.id}/change-stage/`,
                { stage: stage }
            );

            setCandidates((prev) =>
                prev.map((c) => (c.id === candidate.id ? { ...c, stage: stage } : c))
            );
            setSelectedCandidate(null);
            setNewStage("");
        } catch (error: any) {
            alert(error.message || "Error al cambiar la etapa");
        } finally {
            setChangingStage(false);
        }
    }

    async function scheduleInterview() {
        if (!interviewingCandidate) return;

        setChangingStage(true);
        try {
            // TODO: Implementar endpoint de backend para agendar entrevista
            // Por ahora, solo mostramos un mensaje de éxito
            toast.success(`Entrevista agendada para ${interviewingCandidate.first_name} ${interviewingCandidate.last_name}`);

            setInterviewDialogOpen(false);
            setInterviewingCandidate(null);
            setInterviewData({ date: "", time: "", notes: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.error || error.message || "Error al agendar entrevista");
        } finally {
            setChangingStage(false);
        }
    }

    const getCandidatesByStage = (stage: CandidateStage) => {
        return candidates.filter((c) => {
            if (c.stage !== stage) return false;
            if (!searchTerm) return true;

            const term = searchTerm.toLowerCase();
            const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
            const email = c.email.toLowerCase();
            const phone = c.phone ? c.phone.toLowerCase() : "";
            const nationalId = c.national_id ? c.national_id.toLowerCase() : "";
            const phoneSubscriber = c.phone_subscriber ? c.phone_subscriber.toLowerCase() : "";
            const phoneCode = c.phone_area_code?.code ? c.phone_area_code.code.toLowerCase() : "";

            return fullName.includes(term) || email.includes(term) || phone.includes(term) || nationalId.includes(term) || phoneSubscriber.includes(term) || phoneCode.includes(term);
        });
    };

    async function loadMore() {
        if (!nextPage) return;
        setLoadingMore(true);
        try {
            const res = await apiClient.get(nextPage);
            setCandidates((prev) => [...prev, ...res.data.results]);
            setNextPage(res.data.next);
        } catch (error) {
            console.error("Error loading more candidates:", error);
            toast.error("Error al cargar más candidatos");
        } finally {
            setLoadingMore(false);
        }
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as number);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeCandidateId = active.id as number;
        const overId = over.id;

        const candidate = candidates.find((c) => c.id === activeCandidateId);
        if (!candidate) {
            setActiveId(null);
            return;
        }

        let newStage: CandidateStage | null = null;

        if (STAGE_ORDER.includes(overId as CandidateStage)) {
            newStage = overId as CandidateStage;
        } else {
            const overCandidate = candidates.find((c) => c.id === overId);
            if (overCandidate) {
                newStage = overCandidate.stage;
            }
        }

        if (newStage && newStage !== candidate.stage) {
            setPendingMove({ candidate, stage: newStage });
            setConfirmMoveDialogOpen(true);
        }

        setActiveId(null);
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <h2 className="text-2xl font-bold">Vacante no encontrada</h2>
                <Link href="/admin/ats/jobs">
                    <Button variant="outline">Volver al listado</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <CatalogHeader
                items={[
                    { name: "ATS", href: "/admin/ats/jobs" },
                    { name: "Vacantes", href: "/admin/ats/jobs" },
                    { name: job.title, href: `/admin/ats/jobs/${job.id}` },
                    { name: "Candidatos", href: "" },
                ]}
            />

            <div className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col">
                <div className="px-6 pt-6 pb-2">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-white"
                        />
                    </div>
                </div>
                <div className="flex-1 min-h-0 p-6 pt-2 overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex h-full min-w-max gap-4 pb-4">
                            {STAGE_ORDER.map((stage) => {
                                const stageCandidates = getCandidatesByStage(stage);
                                return (
                                    <DroppableColumn key={stage} id={stage} className="flex w-[300px] flex-col gap-4 shrink-0">
                                        <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${stage === 'NEW' ? 'bg-blue-500' :
                                                    stage === 'REV' ? 'bg-purple-500' :
                                                        stage === 'INT' ? 'bg-yellow-500' :
                                                            stage === 'OFF' ? 'bg-orange-500' :
                                                                'bg-green-500'
                                                    }`} />
                                                <h3 className="font-semibold text-sm">
                                                    {CANDIDATE_STAGE_LABELS[stage]}
                                                </h3>
                                            </div>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                {stageCandidates.length}
                                            </Badge>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                            <SortableContext
                                                items={stageCandidates.map((c) => c.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {stageCandidates.map((candidate) => (
                                                    <SortableCandidateCard
                                                        key={candidate.id}
                                                        candidate={candidate}
                                                        showMove={true}
                                                        showHire={stage === "OFF"}
                                                        showInterview={stage === "INT"}
                                                        onMove={() => {
                                                            setSelectedCandidate(candidate);
                                                            setNewStage("");
                                                        }}
                                                        onHire={() => {
                                                            router.push(`/admin/personnel/employees/new?from_candidate=${candidate.id}`);
                                                        }}
                                                        onInterview={() => {
                                                            setInterviewingCandidate(candidate);
                                                            setInterviewDialogOpen(true);
                                                        }}
                                                    />
                                                ))}
                                            </SortableContext>
                                            {stageCandidates.length === 0 && (
                                                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm text-muted-foreground">
                                                    Sin candidatos
                                                </div>
                                            )}
                                        </div>
                                    </DroppableColumn>
                                );
                            })}
                        </div>
                        <DragOverlay>
                            {activeId ? (
                                <CandidateCard
                                    candidate={candidates.find((c) => c.id === activeId)!}
                                    showMove={false} // Hide buttons during drag
                                    showHire={false}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
                {nextPage && (
                    <div className="p-4 flex justify-center border-t bg-white">
                        <Button
                            variant="outline"
                            onClick={loadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                "Cargar más candidatos"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Change Stage Dialog */}
            {selectedCandidate && (
                <Dialog
                    open={!!selectedCandidate}
                    onOpenChange={(open) => !open && setSelectedCandidate(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cambiar Etapa</DialogTitle>
                            <DialogDescription>
                                Mover a {selectedCandidate.first_name} {selectedCandidate.last_name} a una
                                nueva etapa
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>Nueva Etapa</Label>
                            <Select value={newStage} onValueChange={(val) => setNewStage(val as CandidateStage)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una etapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STAGE_ORDER.map((stage) => (
                                        <SelectItem
                                            key={stage}
                                            value={stage}
                                            disabled={stage === selectedCandidate.stage}
                                        >
                                            {CANDIDATE_STAGE_LABELS[stage]}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="REJ">Rechazado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => newStage && changeStage(selectedCandidate, newStage as CandidateStage)}
                                disabled={!newStage || changingStage}
                            >
                                {changingStage ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Moviendo...
                                    </>
                                ) : (
                                    "Mover"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Interview Dialog */}
            <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agendar Entrevista</DialogTitle>
                        <DialogDescription>
                            Programa una entrevista para{" "}
                            {interviewingCandidate?.first_name} {interviewingCandidate?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="interview_date">Fecha</Label>
                            <Input
                                id="interview_date"
                                type="date"
                                value={interviewData.date}
                                onChange={(e) =>
                                    setInterviewData({ ...interviewData, date: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="interview_time">Hora</Label>
                            <Input
                                id="interview_time"
                                type="time"
                                value={interviewData.time}
                                onChange={(e) =>
                                    setInterviewData({ ...interviewData, time: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="interview_notes">Notas (opcional)</Label>
                            <Input
                                id="interview_notes"
                                placeholder="Por ejemplo: Entrevista técnica con el equipo"
                                value={interviewData.notes}
                                onChange={(e) =>
                                    setInterviewData({ ...interviewData, notes: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInterviewDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={scheduleInterview}
                            disabled={!interviewData.date || !interviewData.time || changingStage}
                        >
                            {changingStage ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Agendando...
                                </>
                            ) : (
                                "Agendar Entrevista"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmMoveDialogOpen} onOpenChange={setConfirmMoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar cambio de etapa</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres mover a {pendingMove?.candidate.first_name} a la etapa{" "}
                            <strong>{pendingMove && CANDIDATE_STAGE_LABELS[pendingMove.stage]}</strong>?
                            <br />
                            <br />
                            <span className="font-medium text-amber-600">
                                Esto enviará automáticamente un correo electrónico de notificación al candidato.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setConfirmMoveDialogOpen(false);
                            setPendingMove(null);
                        }}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (pendingMove) {
                                changeStage(pendingMove.candidate, pendingMove.stage);
                                setConfirmMoveDialogOpen(false);
                                setPendingMove(null);
                            }
                        }}>
                            Confirmar y Enviar Correo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
