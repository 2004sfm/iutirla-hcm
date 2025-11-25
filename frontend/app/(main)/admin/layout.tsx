import { AdminSidebar } from "@/components/AdminSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requireAdmin={true}>
            {/* Este Provider vive DENTRO del main del layout global */}
            <SidebarProvider
                className="min-h-full h-full flex"
                style={{
                    "--sidebar-width": "16rem", // Ancho de la sidebar de Admin (no la global)
                } as React.CSSProperties}
            >
                <div className="flex h-full w-full">
                    {/* Esta Sidebar de Admin aparecerá a la derecha de tu SiteSidebar global */}
                    <AdminSidebar />

                    <section className="flex flex-col h-full w-full overflow-hidden">
                        {children}
                    </section>
                </div>
            </SidebarProvider>
        </ProtectedRoute>
    );
}