"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { DynamicBreadcrumbs } from "./dynamic-breadcrumbs";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { user } = useAuth();

    const role = user?.is_staff ? "admin" : "employee";

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <div className="hidden md:block">
                <Sidebar collapsed={sidebarCollapsed} role={role} />
            </div>

            {/* Header */}
            <Header onToggleSidebar={toggleSidebar} collapsed={sidebarCollapsed} />

            {/* Main Content */}
            <main
                className={cn(
                    "pt-14 transition-all duration-300 ml-0",
                    sidebarCollapsed ? "md:ml-16" : "md:ml-64"
                )}
            >
                <div className="p-6">
                    <DynamicBreadcrumbs />
                    {children}
                </div>
            </main>
        </div>
    );
}
