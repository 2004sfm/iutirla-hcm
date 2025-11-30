import { Skeleton } from "@/components/ui/skeleton";


interface TableSkeletonProps {
    columnCount: number;
    rowCount?: number;
}

export function TableSkeleton({ columnCount, rowCount = 5, withSearch = true }: TableSkeletonProps & { withSearch?: boolean }) {
    return (
        <div className="space-y-4">
            {withSearch && (
                <div className="flex items-center">
                    <Skeleton className="h-10 w-full max-w-sm" />
                </div>
            )}
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border rounded-md bg-muted/10">
                    {Array.from({ length: columnCount }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-24" />
                    ))}
                </div>

                {/* Rows */}
                <div className="space-y-2">
                    {Array.from({ length: rowCount }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 border rounded-md">
                            {Array.from({ length: columnCount }).map((_, j) => (
                                <Skeleton key={j} className="h-4 w-24" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
