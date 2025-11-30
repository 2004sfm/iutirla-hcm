import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpecificCatalogSkeleton({ showBreadcrumbs = false, className }: { showBreadcrumbs?: boolean, className?: string }) {
    return (
        <div className={cn("space-y-6", className)}>
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

            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" /> {/* Title */}
                <Skeleton className="h-10 w-24" /> {/* New Button */}
            </div>

            <TableSkeleton columnCount={3} rowCount={5} />
        </div>
    )
}
