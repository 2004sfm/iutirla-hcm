'use client';

import { CatalogHeader } from "@/components/CatalogHeader";
import { PeriodManager } from "@/components/PeriodManager";

export default function PeriodsPage() {
    return (
        <>
            <CatalogHeader items={[
                { name: "Evaluación", href: "#" },
                { name: "Periodos", href: "/admin/performance/periods" }
            ]} />

            <div className="flex-1 overflow-y-auto px-8 py-6">
                <PeriodManager />
            </div>
        </>
    );
}