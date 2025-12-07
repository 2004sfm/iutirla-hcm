"use client";

import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, UserCheck, Users } from "lucide-react";
import { Candidate } from "@/types/ats";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CandidateCardProps {
    candidate: Candidate;
    onMove?: (candidate: Candidate) => void;
    onHire?: (candidate: Candidate) => void;
    onInterview?: (candidate: Candidate) => void;
    showMove?: boolean;
    showHire?: boolean;
    showInterview?: boolean;
    color?: string; // Expect a border/bg color class prefix e.g 'border-red-500'
}

export function CandidateCard({
    candidate,
    onMove,
    onHire,
    onInterview,
    showMove,
    showHire,
    showInterview,
    color = "bg-primary", // Expect a bg color class now
}: CandidateCardProps) {
    const router = useRouter();

    return (
        <Card className="cursor-grab transition-all hover:shadow-md active:cursor-grabbing bg-white dark:bg-slate-800 rounded-lg border-0 shadow-sm overflow-hidden flex flex-col group p-0">
            {/* Header Strip with Color */}
            <div className={cn("h-8 px-3 flex items-center justify-between text-[10px] font-bold text-white uppercase tracking-wider md:text-xs", color)}>
                <span className="opacity-90">
                    {candidate.created_at
                        ? new Date(candidate.created_at).toLocaleString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                        })
                        : "-"}
                </span>

                {/* Actions overlaid on header or just icons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-white hover:bg-white/20 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/ats/candidates/${candidate.id}`);
                        }}
                        title="Ver detalle"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <CardContent className="p-3 flex flex-col gap-3">
                {/* Main Info */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        {candidate.job_posting_title || "Candidato"}
                    </span>
                    <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2 uppercase">
                        {candidate.first_name} {candidate.last_name}
                    </h3>
                </div>

                {/* Footer: Avatar & Context */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        {candidate.avatar ? (
                            <img
                                src={candidate.avatar}
                                alt="avatar"
                                className="h-8 w-8 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-700 shadow-sm">
                                {candidate.first_name[0]}{candidate.last_name[0]}
                            </div>
                        )}
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] text-muted-foreground leading-none">{candidate.email}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar (if needed explicit actions) */}
                <div className="flex items-center justify-end gap-2 border-t pt-2 border-dashed border-slate-100 dark:border-slate-700">
                    {showMove && onMove && (
                        <div className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-move text-slate-400 hover:text-foreground transition-colors" title="Arrastrar para mover">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m5 9-3 3 3 3" /><path d="m19 9 3 3-3 3" /><path d="M2 12h20" /><path d="m9 5 3-3 3 3" /><path d="m9 19 3 3 3-3" /></svg>
                        </div>
                    )}
                    {showInterview && onInterview && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                            onClick={(e) => { e.stopPropagation(); onInterview!(candidate); }}
                        >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Entrevistar
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function SortableCandidateCard(props: CandidateCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props.candidate.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1, // Slightly less transparent on drag
        zIndex: isDragging ? 50 : "auto", // Ensure visibility on drag
        position: 'relative' as 'relative', // Explicit for type safety
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <CandidateCard {...props} />
        </div>
    );
}

export function DroppableColumn({
    id,
    children,
    className,
}: {
    id: string;
    children: React.ReactNode;
    className?: string;
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={className}>
            {children}
        </div>
    );
}
