"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReviewDetail } from "@/types/performance";
import { cn } from "@/lib/utils";

interface CompetencyRatingProps {
    detail: ReviewDetail;
    onChange: (detail: ReviewDetail) => void;
    disabled?: boolean;
}

export function CompetencyRating({ detail, onChange, disabled = false }: CompetencyRatingProps) {
    const [hoveredScore, setHoveredScore] = useState<number | null>(null);

    const handleScoreChange = (score: number) => {
        if (!disabled) {
            onChange({ ...detail, score });
        }
    };

    const handleCommentChange = (comment: string) => {
        if (!disabled) {
            onChange({ ...detail, comment });
        }
    };

    return (
        <div className="border rounded-lg p-4 space-y-4 hover:bg-accent/50 transition-colors">
            {/* Competency Header */}
            <div>
                <h4 className="font-semibold text-base">{detail.competency_name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{detail.competency_description}</p>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Calificación *</Label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => {
                        const isActive = score <= (hoveredScore ?? detail.score);
                        return (
                            <button
                                key={score}
                                type="button"
                                disabled={disabled}
                                onMouseEnter={() => !disabled && setHoveredScore(score)}
                                onMouseLeave={() => !disabled && setHoveredScore(null)}
                                onClick={() => handleScoreChange(score)}
                                className={cn(
                                    "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded",
                                    disabled && "cursor-not-allowed opacity-50"
                                )}
                            >
                                <Star
                                    className={cn(
                                        "w-8 h-8 transition-all",
                                        isActive
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                    )}
                                />
                            </button>
                        );
                    })}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                        {detail.score > 0 ? `${detail.score}/5` : "Sin calificar"}
                    </span>
                </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
                <Label htmlFor={`comment-${detail.competency}`} className="text-sm font-medium">
                    Observaciones (Opcional)
                </Label>
                <Textarea
                    id={`comment-${detail.competency}`}
                    value={detail.comment || ""}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder="Agrega comentarios específicos sobre esta competencia..."
                    rows={2}
                    disabled={disabled}
                    className="resize-none"
                />
            </div>
        </div>
    );
}
