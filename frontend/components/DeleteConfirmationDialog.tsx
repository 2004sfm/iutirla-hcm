'use client';

import React, { useState, useCallback } from 'react';
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
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

interface DeleteConfirmationDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirmDelete: () => Promise<void>;
    successMessage?: string;
    genericErrorMessage?: string;
}

export function DeleteConfirmationDialog({
    open,
    setOpen,
    title = "¿Estás seguro?",
    description = "Esta acción es irreversible y no se podrá deshacer.",
    onConfirmDelete,
    successMessage = "Eliminación exitosa.",
    genericErrorMessage = "Ocurrió un error inesperado al eliminar."
}: DeleteConfirmationDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleClose = useCallback((newOpen: boolean) => {
        if (!newOpen) {
            setDeleteError(null);
            setIsDeleting(false);
        }
        setOpen(newOpen);
    }, [setOpen]);

    const handleConfirmation = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await onConfirmDelete();
            toast.success(successMessage);
            setOpen(false);
        } catch (err) {
            let errorMessage = genericErrorMessage;
            if (err instanceof AxiosError) {
                const axiosError = err as AxiosError<DjangoErrorResponse>;
                errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.non_field_errors?.[0] || genericErrorMessage;
            }

            // Mostrar error dentro del diálogo
            setDeleteError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{deleteError ? "Error al Eliminar" : title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {deleteError || description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {deleteError ? (
                        <AlertDialogAction onClick={() => handleClose(false)}>Cerrar</AlertDialogAction>
                    ) : (
                        <>
                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <Button onClick={handleConfirmation} disabled={isDeleting} variant="destructive">
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Eliminar"}
                            </Button>
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}