import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider className="min-h-full h-full flex" style={
            {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
        }>
            <div className="relative flex w-full">
                <EmployeeSidebar />
                <section className="flex flex-col h-full w-full">
                    {children}
                </section>
            </div>
        </SidebarProvider>
    );
}