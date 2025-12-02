"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.results || res.data);

interface CourseRequestsProps {
    courseId: string;
}

export default function CourseRequests({ courseId }: CourseRequestsProps) {
    const [isProcessing, setIsProcessing] = useState<number | null>(null);

    // Approve enrollment request
    const handleApprove = async (participantId: number) => {
        setIsProcessing(participantId);
        try {
            await apiClient.post(`/api/training/courses/${courseId}/approve_enrollment/`, {
                participant_id: participantId
            });
            toast.success("Solicitud aprobada exitosamente");
            mutate(`/api/training/participants/?course=${courseId}&enrollment_status=REQ`);
            // Also refresh students list in other tab if needed, though SWR might not share cache across components if keys differ slightly
            mutate(`/api/training/participants/?course=${courseId}&role=EST&enrollment_status=ENR`);
        } catch (error: any) {
            console.error("Error approving enrollment:", error);
            toast.error(error.response?.data?.error || "Error al aprobar la solicitud");
        } finally {
            setIsProcessing(null);
        }
    };

    // Reject enrollment request
    const handleReject = async (participantId: number) => {
        setIsProcessing(participantId);
        try {
            await apiClient.post(`/api/training/courses/${courseId}/reject_enrollment/`, {
                participant_id: participantId
            });
            toast.success("Solicitud rechazada");
            mutate(`/api/training/participants/?course=${courseId}&enrollment_status=REQ`);
        } catch (error: any) {
            console.error("Error rejecting enrollment:", error);
            toast.error(error.response?.data?.error || "Error al rechazar la solicitud");
        } finally {
            setIsProcessing(null);
        }
    };

    // Pending Requests Configuration
    const pendingFields: CatalogField[] = [];
    const pendingColumns: ColumnDef<any>[] = [
        { accessorKey: "person_name", header: "Nombre", cell: ({ row }) => row.getValue("person_name") },
        { accessorKey: "created_at", header: "Fecha Solicitud", cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString() },
    ];

    return (
        <div className="space-y-4">
            <CatalogCRUD
                title="Solicitudes de Inscripción"
                apiUrl={`/api/training/participants/?course=${courseId}&enrollment_status=REQ`}
                fields={pendingFields}
                columns={pendingColumns}
                disableCreate={true}
                disableEdit={true}
                disableDelete={true}
                disablePagination={true} // Show all requests
                extraActions={(item) => (
                    <div className="flex gap-2 justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(item.id)}
                            disabled={isProcessing === item.id}
                        >
                            {isProcessing === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            <span className="sr-only">Aprobar</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(item.id)}
                            disabled={isProcessing === item.id}
                        >
                            {isProcessing === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            <span className="sr-only">Rechazar</span>
                        </Button>
                    </div>
                )}
            />
        </div>
    );
}
