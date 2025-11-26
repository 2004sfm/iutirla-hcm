'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus, Pencil, Trash2, Loader2, AlertCircle,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
// Importamos el toast para las notificaciones de éxito
import { toast } from "sonner";
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

export type FieldType = "text" | "number" | "email" | "date" | "select" | "boolean";

export interface FormFieldDef {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    optionsEndpoint?: string;
    optionsLabelKey?: string;
    helpText?: string;
    defaultValue?: string | number | boolean;
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
    title: string; // Título en plural
    singularTitle: string; // <-- ¡NUEVA PROP!
    columns?: ColumnDef[];
    formFields?: FormFieldDef[];
    editUrl?: string;
}

export function CatalogManager({ endpoint, title, singularTitle, columns, formFields, editUrl }: CatalogManagerProps) {
    const router = useRouter();

    const [data, setData] = useState<CatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

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
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const loadData = useCallback(async (page: number, size: number) => {
        setIsRefreshing(true);
        setFetchError(null);
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}page=${page}&page_size=${size}`;

        try {
            const response = await apiClient.get(url);
            if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                setData(response.data.results);
                setTotalCount(response.data.count || 0);
            } else if (Array.isArray(response.data)) {
                setData(response.data);
                setTotalCount(response.data.length);
            } else {
                setData([]);
                setTotalCount(0);
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 404 && page > 1) {
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

    useEffect(() => {
        setIsLoading(true);
        loadData(currentPage, pageSize);
    }, [endpoint, currentPage, pageSize, loadData]);

    const refreshData = () => loadData(currentPage, pageSize);

    // --- MANEJADOR DE ÉXITO DE FORMULARIO ---
    // Recibe un booleano para saber si fue edición o creación
    const handleSuccess = (isEditing: boolean) => {
        setIsModalOpen(false); // Cierra el modal
        refreshData(); // Refresca los datos de la tabla

        const action = isEditing ? 'actualizad@' : 'cread@';

        // Muestra el toast de éxito
        toast.success(`${singularTitle} ${action} exitosamente`);
    };

    // --- MANEJADORES DE ACCIONES ---
    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: CatalogItem) => {
        if (editUrl) {
            router.push(`${editUrl}/${item.id}`);
        } else {
            setEditingItem(item);
            setIsModalOpen(true);
        }
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
            // Muestra toast de eliminación
            toast.success(`${singularTitle} eliminad@ exitosamente`);
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
                                            <div className="truncate max-w-[300px]" title={item[col.accessorKey]?.toString()}>
                                                {typeof item[col.accessorKey] === 'boolean' ? (
                                                    // CASO BOOLEANO: Mostramos Badges
                                                    item[col.accessorKey] ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            Sí
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                                            No
                                                        </span>
                                                    )
                                                ) : (
                                                    item[col.accessorKey] ?? <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {(formFields || editUrl) && (
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
                    {totalCount > 0 ? <>Mostrando {data.length} de {totalCount} registros</> : "Sin registros"}
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium hidden sm:block">Filas</p>
                        <Select value={`${pageSize}`} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={pageSize} /></SelectTrigger>
                            <SelectContent side="top">{[5, 10, 20, 50, 100].map((size) => (<SelectItem key={size} value={`${size}`}>{size}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">Página {currentPage} de {totalPages}</div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || isLoading}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || isLoading}><ChevronsRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>

            {formFields && isModalOpen && (
                <CatalogForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    // ✨ PASAMOS EL NUEVO MANEJADOR DE ÉXITO
                    onSuccess={handleSuccess}
                    endpoint={endpoint}
                    fields={formFields}
                    initialData={editingItem || undefined}
                    isEditing={!!editingItem}
                    title={editingItem ? `Editar ${singularTitle}` : `Crear ${singularTitle}`}
                />
            )}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleCloseDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{deleteError ? "Error" : "¿Estás seguro?"}</AlertDialogTitle><AlertDialogDescription>{deleteError || "Esta acción es irreversible."}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        {deleteError ? <AlertDialogAction onClick={() => handleCloseDeleteAlert(false)}>Cerrar</AlertDialogAction> : <><AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel><Button onClick={confirmDelete} disabled={isDeleting} variant="destructive">{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}</Button></>}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
