'use client';
import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus, Pencil, Trash2, Loader2, AlertCircle,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { CatalogForm } from './CatalogForm';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AxiosError } from 'axios';

// --- TIPOS ---

export type FieldType = "text" | "number" | "email" | "date" | "select";

export interface FormFieldDef {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    optionsEndpoint?: string;
    optionsLabelKey?: string;
    helpText?: string;
}

export interface ColumnDef {
    header: string;
    accessorKey: string;
}

interface CatalogItem {
    id: number;
    [key: string]: string | number | boolean | null | undefined;
}

interface CatalogManagerProps {
    endpoint: string;
    title: string;
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
}

export function CatalogManager({ endpoint, title, columns, formFields }: CatalogManagerProps) {
    // Estados de Datos
    const [data, setData] = useState<CatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Estados de Paginación Avanzada
    const [currentPage, setCurrentPage] = useState(1);
    // RESTAURADO: pageSize ahora es estado (mutable) y defecto 5
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Estados de UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const defaultColumns: ColumnDef[] = [
        { header: "ID", accessorKey: "id" },
        { header: "Nombre", accessorKey: "name" },
    ];

    const activeColumns = columns || defaultColumns;

    // Cálculo dinámico de páginas totales
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const loadData = useCallback(async (page: number, size: number) => {
        setIsRefreshing(true);
        setFetchError(null);

        // Enviamos page_size explícitamente para forzar la sincronización con el backend
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}page=${page}&page_size=${size}`;

        console.log("Fetching:", url);

        try {
            const response = await apiClient.get(url);

            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                // Respuesta Paginada
                setData(response.data.results);
                setTotalCount(response.data.count || 0);
            } else if (Array.isArray(response.data)) {
                // Respuesta Plana (fallback)
                setData(response.data);
                setTotalCount(response.data.length);
            } else {
                setData([]);
                setTotalCount(0);
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 404 && page > 1) {
                // Si la página no existe, retrocedemos una
                setCurrentPage(prev => Math.max(1, prev - 1));
            } else {
                console.error(`Error fetching ${url}:`, error);
                setFetchError("Error de conexión al cargar datos.");
            }
            setData([]);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [endpoint]);

    // Efecto para cargar datos cuando cambia página O tamaño
    useEffect(() => {
        setIsLoading(true);
        loadData(currentPage, pageSize);
    }, [endpoint, currentPage, pageSize, loadData]);

    const refreshData = () => {
        loadData(currentPage, pageSize);
    };

    // --- MANEJADORES ---
    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: CatalogItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeleteError(null);
        setItemToDelete(id);
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete === null) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`${endpoint}${itemToDelete}/`);
            setIsDeleteAlertOpen(false);
            refreshData();
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 400) {
                setDeleteError("No se pudo eliminar: Este registro tiene dependencias.");
            } else {
                setDeleteError("Error de conexión al intentar eliminar.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteAlert = (open: boolean) => {
        if (!open) {
            setIsDeleteAlertOpen(false);
            setItemToDelete(null);
            setDeleteError(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                {formFields && (
                    <Button size="sm" className="gap-2" onClick={handleCreate} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {isRefreshing ? 'Cargando...' : 'Nuevo'}
                    </Button>
                )}
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {activeColumns.map((col) => (
                                <TableHead key={col.accessorKey}>{col.header}</TableHead>
                            ))}
                            <TableHead className="text-right w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: pageSize }).map((_, i) => (
                                <TableRow key={i}>
                                    {activeColumns.map((col) => (
                                        <TableCell key={col.accessorKey}><Skeleton className="h-6 w-full" /></TableCell>
                                    ))}
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={activeColumns.length + 1} className="h-32 text-center text-muted-foreground">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    {activeColumns.map((col) => (
                                        <TableCell key={col.accessorKey}>
                                            {/* Texto truncado con tooltip nativo */}
                                            <div
                                                className="truncate max-w-[300px]"
                                                title={item[col.accessorKey]?.toString()}
                                            >
                                                {item[col.accessorKey]}
                                            </div>
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {formFields && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    {totalCount > 0 ? (
                        <>Mostrando {data.length} de {totalCount} registros</>
                    ) : (
                        "Sin registros"
                    )}
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">

                    {/* RESTAURADO: Selector de Filas por página */}
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium hidden sm:block">Filas</p>
                        <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setCurrentPage(1); // Reset a pag 1 al cambiar tamaño
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {/* Opciones de paginación */}
                                {[5, 10, 20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {currentPage} de {totalPages}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <span className="sr-only">Ir a primera página</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || isLoading}
                        >
                            <span className="sr-only">Siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || isLoading}
                        >
                            <span className="sr-only">Ir a última página</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- MODALES --- */}
            {formFields && isModalOpen && (
                <CatalogForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshData}
                    endpoint={endpoint}
                    fields={formFields}
                    initialData={editingItem || undefined}
                    isEditing={!!editingItem}
                    title={editingItem ? `Editar ${title}` : `Crear ${title}`}
                />
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleCloseDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{deleteError ? "Error" : "¿Estás seguro?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteError || "Esta acción es irreversible."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {deleteError ? (
                            <AlertDialogAction onClick={() => handleCloseDeleteAlert(false)}>Cerrar</AlertDialogAction>
                        ) : (
                            <>
                                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                                <Button onClick={confirmDelete} disabled={isDeleting} variant="destructive">
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
                                </Button>
                            </>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}