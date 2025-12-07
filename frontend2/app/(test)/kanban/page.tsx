"use client";

import React, { useState } from "react";
import {
    DndContext,
    useDraggable,
    useDroppable,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { CANDIDATE_STAGE_LABELS, CandidateStage } from "@/types/ats";

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

const STAGE_TEXT_COLORS: Record<CandidateStage, string> = {
    NEW: "text-red-50",
    REV: "text-orange-50",
    INT: "text-yellow-50",
    OFF: "text-teal-50",
    HIRED: "text-green-50",
    REJ: "text-slate-50",
    POOL: "text-blue-50",
};

// --- Child Components ---

function DraggableItem() {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: "test-candidate",
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "w-full h-24 rounded-lg shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center font-bold text-white transition-transform hover:scale-105",
                "bg-white/20 backdrop-blur-sm border-2 border-white/50",
                isDragging ? "opacity-0" : "opacity-100"
            )}
        >
            Candidato
        </div>
    );
}

interface AccordionColumnProps {
    stage: CandidateStage;
    isActive: boolean;
    onHover: (stage: CandidateStage) => void;
    children: React.ReactNode;
}

function AccordionColumn({
    stage,
    isActive,
    onHover,
    children,
}: AccordionColumnProps) {
    const { setNodeRef } = useDroppable({
        id: stage,
    });

    return (
        <div
            ref={setNodeRef}
            // On mobile, click to expand. On desktop, hover handles it.
            onClick={() => onHover(stage)}
            onMouseEnter={() => onHover(stage)}
            className={cn(
                // Base: Vertical Layout (Mobile)
                // md: Horizontal Layout (Desktop)
                "transition-all duration-500 ease-in-out relative flex flex-col overflow-hidden",
                "w-full md:h-full md:w-auto", // Width full on mobile, auto on desktop
                STAGE_COLORS[stage],
                isActive
                    ? "flex-3 opacity-100 md:w-[320px] md:flex-none" // Mobile: grow vertically. Desktop: fixed width.
                    : "flex-1 opacity-90 hover:opacity-100 cursor-pointer md:flex-1" // Mobile: share remaining height. Desktop: share remaining width.
            )}
        >
            {isActive ? (
                // Expanded Content
                <div className="p-4 md:p-6 flex flex-col h-full animate-in fade-in duration-500 w-full min-h-[200px] md:min-w-[300px]">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 uppercase tracking-wider">
                        {CANDIDATE_STAGE_LABELS[stage]}
                    </h2>
                    <div className="flex-1 rounded-xl bg-black/10 p-4 space-y-4 border border-white/10 overflow-y-auto">
                        {children}
                    </div>
                </div>
            ) : (
                // Collapsed Content
                // Mobile: Horizontal Text centered. Desktop: Vertical Text rotated.
                <div className="h-full w-full flex items-center justify-center min-h-[40px] md:min-w-[60px]">
                    <div className="rotate-0 md:-rotate-90 whitespace-nowrap text-lg md:text-xl font-bold text-white/80 uppercase tracking-widest">
                        {CANDIDATE_STAGE_LABELS[stage]}
                    </div>

                    {/* Indicator */}
                    {React.Children.count(children) > 0 && (
                        <div className="absolute right-4 md:right-auto md:bottom-10 w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">
                            {React.Children.count(children)}
                        </div>
                    )}
                </div>
            )}

            {/* Overlay */}
            {!isActive && <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />}
        </div>
    );
}

// --- Main Page ---

export default function TestKanbanPage() {
    const [activeStage, setActiveStage] = useState<CandidateStage>('NEW');
    const [itemStage, setItemStage] = useState<CandidateStage>('NEW');
    const [activeId, setActiveId] = useState<string | null>(null);

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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (over && STAGES.includes(over.id as CandidateStage)) {
            // Expand the column we are hovering over
            setActiveStage(over.id as CandidateStage);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { over } = event;
        setActiveId(null);
        if (over) {
            const newStage = over.id as CandidateStage;
            setItemStage(newStage);
            // Keep the target column expanded after drop
            setActiveStage(newStage);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-950 overflow-hidden">
            <h1 className="text-2xl font-bold mb-4">Accordion Kanban Test</h1>
            <div className="h-[calc(100%-80px)] md:h-[600px] w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    {STAGES.map((stage) => (
                        <AccordionColumn
                            key={stage}
                            stage={stage}
                            isActive={stage === activeStage}
                            onHover={setActiveStage}
                        >
                            {itemStage === stage && <DraggableItem />}
                        </AccordionColumn>
                    ))}

                    <DragOverlay>
                        {activeId ? (
                            <div className="w-full h-24 rounded-lg bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center font-bold text-white shadow-2xl rotate-3 cursor-grabbing">
                                Candidato
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
                Hover over sections to expand them. Drag the "Candidato" card to move it between stages.
            </p>
        </div>
    );
}
