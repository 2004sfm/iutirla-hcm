import { AdminHeader, BreadcrumbItemType } from "@/components/AdminHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Compensación", href: "/employee/compensation" },
];

export default function CompensationPage() {
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