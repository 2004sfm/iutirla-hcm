import { CatalogHeader, BreadcrumbItemType } from "@/components/CatalogHeader";

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Datos del Puesto", href: "/employee/job-data" },
];

export default function JobDataPage() {
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