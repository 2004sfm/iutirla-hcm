'use client';

import { use } from 'react';
import { CatalogHeader } from "@/components/CatalogHeader";
import { PerformanceEvaluationForm } from "@/components/PerformanceEvaluationForm";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function EvaluationRoomPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. Extraer el ID de la URL
    const resolvedParams = use(params);
    const reviewId = parseInt(resolvedParams.id);

    // 2. Definir las migas de pan
    const breadcrumbItems = [
        { name: "Evaluación", href: "/performance/team" },
        { name: "Boletas", href: "/performance/team" },
        { name: "Evaluar", href: `#` }
    ];

    return (
        <>
            <CatalogHeader items={breadcrumbItems} hideSidebarTrigger />

            {/* 3. Contenedor principal */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-slate-50/50 dark:bg-slate-950">
                {/* 4. Llamar al Formulario y pasar el ID */}
                <PerformanceEvaluationForm reviewId={reviewId} />
            </div>
        </>
    );
}