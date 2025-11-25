import { CatalogHeader, BreadcrumbItemType } from "@/components/CatalogHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Gestión del Tiempo", href: "/employee/time-management" },
];

export default function TimeManagementPage() {
    return (
        <>
            <CatalogHeader
                items={breadcrumbItems}
            />
            <div className="flex-1 overflow-y-auto px-8 py-4">
                lorem*1000
            </div>
        </>
    )
}