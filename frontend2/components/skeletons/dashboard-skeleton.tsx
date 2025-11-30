import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function DashboardSkeleton({ showBreadcrumbs = false, className }: { showBreadcrumbs?: boolean, className?: string }) {
    return (
        <div className={cn("flex-1", className)}>
            {/* Breadcrumb Skeleton */}
            {showBreadcrumbs && (
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-5 w-16" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-24" />
                </div>
            )}

            {/* Header Skeleton */}
            <div className="space-y-2 mb-6">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    );
}
