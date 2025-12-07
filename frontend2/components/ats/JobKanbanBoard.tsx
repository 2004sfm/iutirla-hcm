"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor,
    MouseSensor
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
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
import { CandidateCard, SortableCandidateCard } from "./KanbanComponents";
import { Candidate, CandidateStage, CANDIDATE_STAGE_LABELS } from "@/types/ats";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

const STAGES: CandidateStage[] = ['NEW', 'REV', 'INT', 'OFF', 'HIRED', 'REJ', 'POOL'];

const STAGE_COLORS: Record<CandidateStage, string> = {
    NEW: "bg-red-500",
    REV: "bg-orange-500",
    INT: "bg-yellow-500",
    OFF: "bg-teal-500",
    HIRED: "bg-green-600",
    REJ: "bg-slate-500",
    POOL: "bg-blue-500",
};

interface JobKanbanBoardProps {
    jobId: string | number;
}

interface AccordionColumnProps {
    stage: CandidateStage;
    isActive: boolean;
    onHover: (stage: CandidateStage) => void;
    children: React.ReactNode;
    count: number;
}

function AccordionDroppableColumn({
    stage,
    isActive,
    onHover,
    children,
    count,
}: AccordionColumnProps) {
    const { setNodeRef } = useDroppable({
        id: stage,
    });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onHover(stage)}
            onMouseEnter={() => onHover(stage)}
            className={cn(
                "transition-all duration-500 ease-in-out relative flex flex-col overflow-hidden",
                "w-full md:w-auto", // Removed fixed md:h-full to allow natural growth, flex stretch handles equal height
                isActive ? "bg-slate-50 dark:bg-slate-900" : STAGE_COLORS[stage], // Active: Neutral BG. Inactive: Colored Spine.
                isActive
                    ? "flex-3 opacity-100 md:w-[350px] md:flex-none"
                    : "flex-1 opacity-90 hover:opacity-100 cursor-pointer md:flex-1 text-white" // Text white for colored spines
            )}
        >
            {isActive ? (
                // Expanded Content
                <div className="flex flex-col animate-in fade-in duration-500 w-full min-h-[200px] md:min-w-[300px] h-full">
                    {/* Header Strip */}
                    <div className={cn("p-4 md:p-6 sticky top-0 z-10 shadow-sm", STAGE_COLORS[stage])}>
                        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
                            {CANDIDATE_STAGE_LABELS[stage]}
                        </h2>
                    </div>

                    {/* Content Body (White/Neutral) */}
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                        {children}
                    </div>
                </div>
            ) : (
                // Collapsed Content
                <div className="h-full w-full flex items-center justify-center min-h-[40px] md:min-w-[60px] py-4">
                    <div className="rotate-0 md:-rotate-90 whitespace-nowrap text-lg md:text-xl font-bold text-white/90 uppercase tracking-widest">
                        {CANDIDATE_STAGE_LABELS[stage]}
                    </div>
                    {/* Indicator */}
                    {count > 0 && (
                        <div className="absolute right-4 md:right-auto md:bottom-10 w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold shadow-sm">
                            {count}
                        </div>
                    )}
                </div>
            )}

            {/* Overlay for collapsed items only if we want to darken them further, but strictly colors are better */}
            {!isActive && <div className="absolute inset-0 bg-black/5 hover:bg-black/0 transition-colors" />}
        </div>
    );
}

export function JobKanbanBoard({ jobId }: JobKanbanBoardProps) {
    const [activeId, setActiveId] = useState<number | null>(null);
    const [activeStage, setActiveStage] = useState<CandidateStage>('NEW');

    // State for confirmation dialog
    const [pendingMove, setPendingMove] = useState<{ candidateId: number; newStage: CandidateStage } | null>(null);

    const { data: candidates, mutate } = useSWR<Candidate[]>(
        `/api/ats/candidates/?job_posting=${jobId}`,
        fetcher
    );

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const groupCandidatesByStage = (candidates: Candidate[] | undefined) => {
        if (!candidates) return {};
        const grouped: Record<string, Candidate[]> = {};
        STAGES.forEach(stage => grouped[stage] = []);
        candidates.forEach(candidate => {
            if (grouped[candidate.stage]) {
                grouped[candidate.stage].push(candidate);
            }
        });
        return grouped;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (over && STAGES.includes(over.id as CandidateStage)) {
            setActiveStage(over.id as CandidateStage);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const candidateId = active.id as number;
        const newStage = over.id as CandidateStage;
        const currentCandidate = candidates?.find(c => c.id === candidateId);

        if (!currentCandidate || currentCandidate.stage === newStage) return;

        // Trigger confirmation dialog
        setPendingMove({ candidateId, newStage });
    };

    const confirmMove = async () => {
        if (!pendingMove) return;

        const { candidateId, newStage } = pendingMove;
        setPendingMove(null); // Close dialog

        // Optimistic update
        mutate(
            (current) => {
                if (!current) return current;
                return current.map((c) =>
                    c.id === candidateId ? { ...c, stage: newStage } : c
                );
            },
            false
        );

        try {
            await apiClient.post(`/api/ats/candidates/${candidateId}/change-stage/`, {
                stage: newStage,
            });
            toast.success("Candidato movido exitosamente");
            mutate();
        } catch (error: any) {
            console.error("Error changing stage:", error);
            toast.error("Error al mover candidato");
            mutate(); // Revert
        }
    };

    const activeCandidate = candidates?.find(c => c.id === activeId);
    const groupedCandidates = groupCandidatesByStage(candidates);

    if (!candidates) return <div className="p-8 text-center">Cargando tablero...</div>;

    return (
        <>
            <div className="min-h-[500px] h-auto w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800 items-stretch">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    {STAGES.map((stage) => {
                        const stageCandidates = groupedCandidates[stage] || [];
                        const candidateIds = stageCandidates.map(c => c.id);

                        return (
                            <AccordionDroppableColumn
                                key={stage}
                                stage={stage}
                                isActive={stage === activeStage}
                                onHover={setActiveStage}
                                count={stageCandidates.length}
                            >
                                <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
                                    {stageCandidates.map((candidate) => (
                                        <SortableCandidateCard
                                            key={candidate.id}
                                            candidate={candidate}
                                            color={STAGE_COLORS[stage]}
                                        />
                                    ))}
                                </SortableContext>
                                {stageCandidates.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 text-sm italic">
                                        Arrastra aquí
                                    </div>
                                )}
                            </AccordionDroppableColumn>
                        );
                    })}

                    <DragOverlay>
                        {activeCandidate ? (
                            <CandidateCard
                                candidate={activeCandidate}
                                color={STAGE_COLORS[activeCandidate.stage]}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <AlertDialog open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Mover candidato?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas mover al candidato a la etapa
                            <span className="font-bold text-foreground"> {pendingMove ? CANDIDATE_STAGE_LABELS[pendingMove.newStage] : ''}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmMove}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
