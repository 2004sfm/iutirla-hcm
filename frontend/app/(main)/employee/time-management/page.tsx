import { AdminHeader, BreadcrumbItemType } from "@/components/AdminHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Gestión del Tiempo", href: "/employee/time-management" },
];

export default function TimeManagementPage() {
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