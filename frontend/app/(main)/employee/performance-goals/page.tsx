import { AdminHeader, BreadcrumbItemType } from "@/components/AdminHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Rendimiento y Metas", href: "/employee/performance-goals" },
];

export default function PerformanceGoalsPage() {
    return (
        <>
            <AdminHeader
                items={breadcrumbItems}
            />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                lorem*1000
            </div>
        </>
    )
}