import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function GeneralCatalogSkeleton({ showBreadcrumbs = false, className }: { showBreadcrumbs?: boolean, className?: string }) {
    return (
        <div className={cn("", className)}>
            {/* Breadcrumb Skeleton */}
            {showBreadcrumbs && (
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-5 w-16" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-24" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-32" />
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <Skeleton className="h-10 w-full md:w-72" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}
