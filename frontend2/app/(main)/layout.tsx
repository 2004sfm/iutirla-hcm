import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/protected-route";

import { BreadcrumbProvider } from "@/context/breadcrumb-context";

export default function MainLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <BreadcrumbProvider>
                <DashboardLayout>
                    {children}
                </DashboardLayout>
            </BreadcrumbProvider>
        </ProtectedRoute>
    );
}