"use client";

import { use } from "react";
import { PerformanceEvaluationForm } from "@/components/performance/performance-evaluation-form";

export default function PerformanceEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const reviewId = parseInt(id);

    return (
        <div className="">
            <PerformanceEvaluationForm reviewId={reviewId} />
        </div>
    );
}
