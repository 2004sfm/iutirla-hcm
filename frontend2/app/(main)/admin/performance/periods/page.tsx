"use client";

import { useState } from "react";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface EvaluationPeriod {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

const periodsFields: CatalogField[] = [
    { name: "name", label: "Nombre del Período", type: "text", required: true },
    { name: "start_date", label: "Fecha Inicio", type: "date", required: true },
    { name: "end_date", label: "Fecha Cierre", type: "date", required: true },
    { name: "is_active", label: "Período Activo", type: "checkbox", defaultValue: true },
];

export default function PeriodsPage() {
    const [generatingFor, setGeneratingFor] = useState<number | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleGenerateReviews = async (periodId: number) => {
        setGeneratingFor(periodId);
        const toastId = toast.loading("Generando evaluaciones...");

        try {
            const response = await apiClient.post(
                `/api/performance/periods/${periodId}/generate_reviews/`
            );

            toast.success(response.data.message || "Evaluaciones generadas exitosamente", {
                id: toastId,
            });

            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            console.error("Error generating reviews:", error);
            toast.error(error.response?.data?.error || "Error al generar evaluaciones", {
                id: toastId,
            });
        } finally {
            setGeneratingFor(null);
        }
    };

    const periodsColumns: ColumnDef<EvaluationPeriod>[] = [
        {
            accessorKey: "name",
            header: "Nombre del Período",
            cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
        },
        {
            accessorKey: "start_date",
            header: "Fecha Inicio",
            cell: ({ row }) => new Date(row.getValue("start_date")).toLocaleDateString("es-VE"),
        },
        {
            accessorKey: "end_date",
            header: "Fecha Cierre",
            cell: ({ row }) => new Date(row.getValue("end_date")).toLocaleDateString("es-VE"),
        },
        {
            accessorKey: "is_active",
            header: "Estado",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active");
                return (
                    <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {isActive ? (
                            <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activo
                            </>
                        ) : (
                            <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactivo
                            </>
                        )}
                    </Badge>
                );
            },
        },
    ];

    const extraActions = (item: EvaluationPeriod) => (
        <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleGenerateReviews(item.id)}
            disabled={generatingFor === item.id || !item.is_active}
        >
            <RefreshCw className={`w-4 h-4 mr-2 ${generatingFor === item.id ? "animate-spin" : ""}`} />
            {generatingFor === item.id ? "Generando..." : "Generar Evaluaciones"}
        </Button>
    );

    return (
        <CatalogCRUD
            title="Períodos de Evaluación"
            apiUrl="/api/performance/periods/"
            fields={periodsFields}
            columns={periodsColumns}
            searchKey="name"
            extraActions={extraActions}
            singularName="Período"
            icon={Calendar}
            refreshKey={refreshKey}
            disablePagination
        />
    );
}
