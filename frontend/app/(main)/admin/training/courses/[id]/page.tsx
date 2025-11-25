'use client';

import { use } from 'react';
import { CatalogHeader } from "@/components/CatalogHeader";
import { CourseManager } from "@/components/CourseManager"; // Importamos el componente

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const courseId = parseInt(resolvedParams.id);

    const breadcrumbItems = [
        { name: "Capacitación", href: "/admin/training/courses" },
        { name: "Gestión de Curso", href: `/admin/training/courses/${courseId}` },
    ];

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            <div className="flex-1 overflow-y-auto px-8 py-6">
                {/* Renderizamos el Manager pasándole el ID */}
                <CourseManager courseId={courseId} />
            </div>
        </>
    );
}