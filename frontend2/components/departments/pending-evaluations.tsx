"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, ArrowRight, ClipboardList } from "lucide-react";
import apiClient from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
    id: number;
    employee_name: string;
    employee_person_id: number;
    position_name: string;
    period_name: string;
    status: string;
    status_display: string;
    // We can assume photo might be needed but serializer doesn't strictly provide it yet without deep nesting handling or consistent mocked data.
    // For now, we use initials fallback.
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export function PendingEvaluations({ departmentId }: { departmentId: number }) {
    const router = useRouter();

    // Fetch reviews where scope=given (I am manager) for this department
    // scope=given ensures only managers see their subordinates' reviews
    const { data: response, isLoading } = useSWR<PaginatedResponse<Review>>(
        `/api/performance/reviews/?scope=given&department=${departmentId}`,
        fetcher
    );

    // Filter for drafts only (status=BOR)
    const pendingReviews = response?.results?.filter(r => r.status === 'BOR') || [];

    if (isLoading) {
        return <Skeleton className="h-24 w-full rounded-md" />;
    }

    if (pendingReviews.length === 0) {
        return null;
    }

    return (
        <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-lg font-semibold text-amber-900">
                        Evaluaciones Pendientes
                    </CardTitle>
                </div>
                <CardDescription className="text-amber-700/80">
                    Tienes {pendingReviews.length} evaluación{pendingReviews.length !== 1 ? 'es' : ''} de desempeño por completar en este departamento.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingReviews.map((review) => (
                    <div
                        key={review.id}
                        className="flex flex-col gap-3 p-4 rounded-lg border border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-amber-100">
                                    <AvatarFallback className="bg-amber-100 text-amber-700 font-medium">
                                        {review.employee_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-slate-900 line-clamp-1" title={review.employee_name}>
                                        {review.employee_name}
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-1" title={review.position_name}>
                                        {review.position_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>{review.period_name}</span>
                        </div>

                        <Button
                            size="sm"
                            className="w-full mt-auto bg-amber-600 hover:bg-amber-700 text-white border-none"
                            onClick={() => router.push(`/performance/${review.id}`)}
                        >
                            Evaluar Ahora
                            <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
