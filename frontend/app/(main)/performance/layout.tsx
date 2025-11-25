import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="flex flex-col min-h-full h-full">
            {children}
        </section>
    );
}