"use client";

import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { GeneralCatalogSkeleton } from "@/components/skeletons/general-catalog-skeleton";
import { SpecificCatalogSkeleton } from "@/components/skeletons/specific-catalog-skeleton";

export function AuthLoading({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuth();
    const pathname = usePathname();

    // Don't show skeleton on login page
    if (pathname === "/login") {
        return <>{children}</>;
    }

    if (isLoading) {
        // Determine which skeleton to show based on the route
        let ContentSkeleton = DashboardSkeleton; // Default

        if (pathname === "/admin/dashboard") {
            ContentSkeleton = DashboardSkeleton;
        } else if (pathname === "/admin/config/general") {
            ContentSkeleton = GeneralCatalogSkeleton;
        } else if (pathname?.startsWith("/admin/config/general/")) {
            ContentSkeleton = SpecificCatalogSkeleton;
        }

        return (
            <div className="min-h-screen bg-background">
                {/* Sidebar Skeleton - Fixed */}
                <div className="hidden md:block fixed left-0 top-0 h-screen w-64 border-r bg-card z-40">
                    <div className="h-14 border-b flex items-center px-6">
                        <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Header Skeleton - Fixed */}
                <div className="fixed top-0 right-0 left-0 md:left-64 h-14 border-b bg-background z-30 flex items-center justify-between px-6">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <main className="pt-14 transition-all duration-300 ml-0 md:ml-64">
                    <ContentSkeleton showBreadcrumbs={true} className="p-6" />
                </main>
            </div>
        );
    }

    return <>{children}</>;
}
