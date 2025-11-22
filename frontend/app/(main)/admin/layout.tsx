import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider className="min-h-full h-full flex" style={
            {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
        }>
            <div className="relative flex w-full">
                <AdminSidebar />
                <section className="flex flex-col h-full w-full">
                    {children}
                </section>
            </div>
        </SidebarProvider>
    );
}