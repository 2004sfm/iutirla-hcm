"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, ChevronLeft, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import apiClient from "@/lib/api-client";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { DepartmentOrgChart } from "@/components/departments/department-org-chart";
import { PendingEvaluations } from "@/components/departments/pending-evaluations";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface Occupant {
    id: number;
    name: string;
    email: string | null;
    photo: string | null;
    hire_date: string;
    is_current_user: boolean;
}

interface Position {
    id: number;
    name: string;
    is_manager: boolean;
    vacancies: number;
    occupants: Occupant[];
    manager_positions: { id: number; name: string }[];
}

interface DepartmentDetail {
    id: number;
    name: string;
    manager: {
        name: string;
        position: string;
    } | null;
    positions: Position[];
}

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: department, error, isLoading } = useSWR<DepartmentDetail>(
        `/api/organization/departments/${id}/detail/`,
        fetcher
    );

    const { user } = useAuth();

    // Permission Check
    const isSuperUser = user?.is_staff;
    const isDepartmentManager = department?.positions.some(pos =>
        pos.is_manager && pos.occupants.some(occ => occ.is_current_user)
    );
    const canViewHistory = isSuperUser || isDepartmentManager;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <TableSkeleton columnCount={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">Error al cargar el departamento</p>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    Volver
                </Button>
            </div>
        );
    }

    if (!department) {
        return null;
    }

    // Flatten positions for the table
    const tableRows: {
        position: Position;
        occupant: Occupant | null;
        isVacancy: boolean;
    }[] = [];

    department.positions.forEach((pos) => {
        if (pos.occupants.length > 0) {
            pos.occupants.forEach((occ) => {
                tableRows.push({ position: pos, occupant: occ, isVacancy: false });
            });
        } else {
            // Show at least one row for vacancy if no occupants
            tableRows.push({ position: pos, occupant: null, isVacancy: true });
        }
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Building2 className="size-6" />
                    {department.name}
                </h1>
                {canViewHistory && (
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/departments/${department.id}/evaluations`)}
                    >
                        Evaluaciones de Desempeño
                    </Button>
                )}
            </div>

            {/* Pending Evaluations Section */}
            <PendingEvaluations departmentId={department.id} />

            {/* Positions Table */}
            <div className="rounded-md border overflow-hidden bg-background">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">Posición</TableHead>
                            <TableHead className="font-semibold">Colaborador</TableHead>
                            <TableHead className="font-semibold">Rol</TableHead>
                            <TableHead className="font-semibold">Fecha Ingreso</TableHead>
                            <TableHead className="font-semibold">Reporta a</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No hay posiciones registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            tableRows.map((row, idx) => (
                                <TableRow key={`${row.position.id}-${idx}`}>
                                    <TableCell>
                                        <span className="font-medium">{row.position.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        {row.isVacancy ? (
                                            <span className="text-muted-foreground italic text-sm">
                                                Vacante
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={row.occupant?.photo || undefined} alt={row.occupant?.name} />
                                                    <AvatarFallback>
                                                        {row.occupant?.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${row.occupant?.is_current_user ? "text-primary" : ""}`}>
                                                        {row.occupant?.name}
                                                        {row.occupant?.is_current_user && " (Tú)"}
                                                    </span>
                                                    {row.occupant?.email && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {row.occupant.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.isVacancy ? (
                                            <span className="text-muted-foreground">-</span>
                                        ) : row.position.is_manager ? (
                                            <Badge className="bg-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/90 text-white gap-1">
                                                <Star className="size-3 fill-current" />
                                                Gerencial
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Operativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.occupant?.hire_date ? (
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(row.occupant.hire_date).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.position.manager_positions.length === 0 ? (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {row.position.manager_positions.map((manager, i) => (
                                                    <span key={i} className="text-sm text-muted-foreground">
                                                        {manager.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Org Chart */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">Organigrama</h2>
                <DepartmentOrgChart positions={department.positions} departmentId={department.id} />
            </div>
        </div>
    );
}
