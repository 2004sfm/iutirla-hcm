"use client";

import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, UserCheck, Users } from "lucide-react";
import { Candidate } from "@/types/ats";
import { useRouter } from "next/navigation";

interface CandidateCardProps {
    candidate: Candidate;
    onMove?: (candidate: Candidate) => void;
    onHire?: (candidate: Candidate) => void;
    onInterview?: (candidate: Candidate) => void;
    showMove?: boolean;
    showHire?: boolean;
    showInterview?: boolean;
}

export function CandidateCard({ candidate, onMove, onHire, onInterview, showMove, showHire, showInterview }: CandidateCardProps) {
    const router = useRouter();

    return (
        <Card className="cursor-grab transition-all hover:shadow-md hover:border-primary/50 active:cursor-grabbing">
            <CardContent className="p-4 space-y-3">
                <div className="mb-2">
                    <div className="flex items-center gap-3 mb-2">
                        {candidate.avatar ? (
                            <img
                                src={candidate.avatar}
                                alt={`${candidate.first_name} ${candidate.last_name}`}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <span className="text-sm font-semibold">
                                    {candidate.first_name[0]}{candidate.last_name[0]}
                                </span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold truncate">
                                {candidate.first_name} {candidate.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                        {candidate.applied_date ? new Date(candidate.applied_date).toLocaleDateString("es-VE", {
                            day: 'numeric',
                            month: 'short'
                        }) : '-'}
                    </span>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 text-xs"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent drag start if clicking button
                            router.push(`/admin/ats/candidates/${candidate.id}`);
                        }}
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag
                    >
                        <Eye className="mr-1.5 h-3 w-3" />
                        Ver
                    </Button>
                    {showMove && onMove && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 flex-1 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMove(candidate);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            Mover
                        </Button>
                    )}
                    {showInterview && onInterview && (
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onInterview(candidate);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <UserCheck className="mr-1.5 h-3 w-3" />
                            Entrevistar
                        </Button>
                    )}
                    {showHire && onHire && (
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 flex-1 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                onHire(candidate);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <UserCheck className="mr-1.5 h-3 w-3" />
                            Contratar
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function SortableCandidateCard(props: CandidateCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.candidate.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <CandidateCard {...props} />
        </div>
    );
}

export function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={className}>
            {children}
        </div>
    );
}
