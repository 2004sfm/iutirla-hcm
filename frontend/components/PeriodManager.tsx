'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import {
    Loader2, Plus, Play, Calendar, CheckCircle2,
    AlertCircle, Pencil, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseBackendDate } from '@/lib/utils';

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch"; // Importante para el estado activo

// Custom
import { DatePicker } from "@/components/DatePicker";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"; // Importar tu diálogo

// Esquema
const periodSchema = z.object({
    name: z.string().min(3, "Nombre obligatorio (Ej: Evaluación 2025)."),
    start_date: z.date("Fecha inicio requerida."),
    end_date: z.date("Fecha fin requerida."),
    is_active: z.boolean().default(true),
}).refine(data => data.end_date >= data.start_date, {
    message: "La fecha de fin debe ser posterior.",
    path: ["end_date"]
});

type PeriodFormData = z.infer<typeof periodSchema>;

export function PeriodManager() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados Modal Creación/Edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null); // ID si estamos editando
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados Modal Generación
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState<string | null>(null);

    // Estados Eliminación
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

    const form = useForm({
        resolver: zodResolver(periodSchema),
        defaultValues: { name: "", is_active: true }
    });

    // --- 1. CARGAR PERIODOS ---
    const fetchPeriods = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/performance/periods/');
            setPeriods(data.results || data);
        } catch (error) {
            toast.error("Error al cargar periodos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

    // --- 2. ABRIR MODAL (CREAR O EDITAR) ---
    const openModal = (period?: any) => {
        if (period) {
            // MODO EDICIÓN
            setEditingId(period.id);
            form.reset({
                name: period.name,
                start_date: parseBackendDate(period.start_date),
                end_date: parseBackendDate(period.end_date),
                is_active: period.is_active
            });
        } else {
            // MODO CREACIÓN
            setEditingId(null);
            form.reset({ name: "", start_date: undefined, end_date: undefined, is_active: true });
        }
        setIsModalOpen(true);
    };

    // --- 3. SUBMIT (POST O PATCH) ---
    const onSubmit = async (data: PeriodFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                start_date: format(data.start_date, "yyyy-MM-dd"),
                end_date: format(data.end_date, "yyyy-MM-dd"),
            };

            if (editingId) {
                await apiClient.patch(`/api/performance/periods/${editingId}/`, payload);
                toast.success("Periodo actualizado.");
            } else {
                await apiClient.post('/api/performance/periods/', payload);
                toast.success("Periodo creado.");
            }

            setIsModalOpen(false);
            fetchPeriods();
        } catch (error) {
            toast.error("Error al guardar el periodo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 4. ELIMINAR ---
    const handleDeleteClick = (period: any) => {
        setItemToDelete({ id: period.id, name: period.name });
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await apiClient.delete(`/api/performance/periods/${itemToDelete.id}/`);
            toast.success("Periodo eliminado.");
            fetchPeriods();
        } catch (error: any) {
            if (error.response?.status === 500 || error.response?.data?.detail?.includes("ProtectedError")) {
                toast.error("No se puede eliminar: Ya existen evaluaciones vinculadas a este periodo.");
            } else {
                toast.error("Error al eliminar.");
            }
        }
    };

    // --- 5. GENERAR BOLETAS ---
    const handleOpenGenerate = (period: any) => {
        setSelectedPeriod(period);
        setGenerationResult(null);
        setIsGenerateOpen(true);
    };

    const confirmGeneration = async () => {
        if (!selectedPeriod) return;
        setIsGenerating(true);
        try {
            const response = await apiClient.post(`/api/performance/periods/${selectedPeriod.id}/generate_reviews/`);
            setGenerationResult(response.data.message || "Proceso completado exitosamente.");
            toast.success("Generación completada.");
        } catch (error: any) {
            setGenerationResult("Error: " + (error.response?.data?.error || "Fallo interno."));
            toast.error("Error en la generación.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Periodos de Evaluación</h2>
                    <p className="text-sm text-muted-foreground">Ciclos de medición de desempeño.</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Periodo
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">Cargando...</TableCell></TableRow>
                        ) : periods.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay periodos registrados.</TableCell></TableRow>
                        ) : (
                            periods.map((period) => (
                                <TableRow key={period.id}>
                                    <TableCell className="font-medium">{period.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {period.start_date} - {period.end_date}
                                    </TableCell>
                                    <TableCell>
                                        {period.is_active
                                            ? <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>
                                            : <Badge variant="secondary">Cerrado</Badge>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Botón Generar (Solo si está activo) */}
                                            {period.is_active && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100"
                                                    title="Generar Boletas"
                                                    onClick={() => handleOpenGenerate(period)}
                                                >
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {/* Botón Editar */}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openModal(period)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            {/* Botón Eliminar */}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(period)}
                                            >
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

            {/* --- MODAL CREAR/EDITAR --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Periodo" : "Nuevo Periodo"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1">
                            <Label>Nombre</Label>
                            <Input {...form.register("name")} placeholder="Ej: Evaluación 2025-I" />
                            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Inicio</Label>
                                <Controller control={form.control} name="start_date" render={({ field }) => (
                                    <DatePicker selected={field.value} onSelect={field.onChange} />
                                )} />
                            </div>
                            <div className="space-y-1">
                                <Label>Fin</Label>
                                <Controller control={form.control} name="end_date" render={({ field }) => (
                                    <DatePicker selected={field.value} onSelect={field.onChange} />
                                )} />
                            </div>
                        </div>

                        {/* Switch Activo */}
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label>Estado del Periodo</Label>
                                <p className="text-xs text-muted-foreground">Activo permite generar y llenar evaluaciones.</p>
                            </div>
                            <Controller
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- MODAL GENERAR --- */}
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Generación Masiva</DialogTitle>
                        <DialogDescription>
                            Se crearán las boletas para <strong>{selectedPeriod?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {generationResult ? (
                        <Alert className={generationResult.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Resultado</AlertTitle>
                            <AlertDescription>{generationResult}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 flex gap-3">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-semibold">¿Cómo funciona?</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Busca empleados con contrato vigente.</li>
                                    <li>Asigna las competencias según el cargo.</li>
                                    <li>No duplica evaluaciones existentes.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!generationResult ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsGenerateOpen(false)}>Cancelar</Button>
                                <Button onClick={confirmGeneration} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                                    Iniciar
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsGenerateOpen(false)}>Cerrar</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- DELETE DIALOG --- */}
            {itemToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteOpen}
                    setOpen={setIsDeleteOpen}
                    onConfirmDelete={confirmDelete}
                    title="¿Eliminar Periodo?"
                    description={`¿Seguro que deseas eliminar "${itemToDelete.name}"?`}
                    successMessage="Periodo eliminado."
                />
            )}
        </div>
    );
}