'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Loader2, Plus, Trash2, Award, BadgeCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from '@/lib/utils';

// UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom
import { DatePicker } from "@/components/DatePicker";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

// Esquema Zod
const certSchema = z.object({
    name: z.string().min(2, "Nombre de la certificación requerido."),
    institution: z.string().min(2, "Institución requerida."),
    description: z.string().optional(),
    effective_date: z.date({ required_error: "Fecha de emisión requerida." }),
    expiration_date: z.date().optional().nullable(),
});

type CertFormData = z.infer<typeof certSchema>;

export function PersonCertificationManager({ personId }: { personId: number }) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Estados Delete
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

    // Fetch
    const fetchCertifications = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/api/talent/certifications/?person=${personId}`);
            setItems(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando certificaciones.");
        } finally {
            setIsLoading(false);
        }
    }, [personId]);

    useEffect(() => { fetchCertifications(); }, [fetchCertifications]);

    // Form
    const form = useForm<CertFormData>({
        resolver: zodResolver(certSchema),
        defaultValues: { name: "", institution: "", description: "", effective_date: undefined, expiration_date: null }
    });

    const openModal = () => {
        setServerError(null);
        form.reset({ name: "", institution: "", description: "", effective_date: undefined, expiration_date: null });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: CertFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const payload = {
                person: personId,
                name: data.name,
                institution: data.institution,
                description: data.description || "",
                effective_date: format(data.effective_date, "yyyy-MM-dd"),
                expiration_date: data.expiration_date ? format(data.expiration_date, "yyyy-MM-dd") : null,
            };

            await apiClient.post('/api/talent/certifications/', payload);

            toast.success("Certificación agregada exitosamente.");
            setIsModalOpen(false);
            fetchCertifications();
        } catch (error) {
            setServerError("No se pudo guardar el registro. Verifique los datos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminar
    const handleDeleteClick = (item: any) => {
        setItemToDelete({ id: item.id, name: item.name });
        setIsDeleteAlertOpen(true);
    };

    const deleteItemAction = async () => {
        if (!itemToDelete) return;
        await apiClient.delete(`/api/talent/certifications/${itemToDelete.id}/`);
        fetchCertifications();
    };

    return (
        <div className="space-y-4">
            {/* HEADER SECCIÓN */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Award className="size-5" />
                    Certificaciones y Cursos
                </h3>
                <Button size="sm" onClick={openModal}>
                    <Plus className="size-4 mr-2" /> Agregar
                </Button>
            </div>

            {/* TABLA */}
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Certificación / Curso</TableHead>
                            <TableHead>Institución Emisora</TableHead>
                            <TableHead>Fecha Emisión</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6">Cargando...</TableCell></TableRow>
                        ) : items.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Sin certificaciones registradas.</TableCell></TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                                            {item.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.institution}</TableCell>
                                    <TableCell className="text-xs">{item.effective_date}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.expiration_date || 'Permanente'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                            onClick={() => handleDeleteClick(item)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>Agregar Certificación</DialogTitle></DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">

                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Nombre */}
                        <div className="space-y-1">
                            <Label className={cn("text-sm", { "text-destructive": form.formState.errors.name })}>
                                Nombre del Curso / Certificación <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field }) => <Input {...field} className="text-sm" placeholder="Ej: Scrum Master, Primeros Auxilios..." />}
                            />
                            {form.formState.errors.name && <span className="text-xs font-medium text-destructive block">{form.formState.errors.name.message}</span>}
                        </div>

                        {/* Institución */}
                        <div className="space-y-1">
                            <Label className={cn("text-sm", { "text-destructive": form.formState.errors.institution })}>
                                Institución Emisora <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="institution"
                                control={form.control}
                                render={({ field }) => <Input {...field} className="text-sm" placeholder="Ej: Google, Cruz Roja..." />}
                            />
                            {form.formState.errors.institution && <span className="text-xs font-medium text-destructive block">{form.formState.errors.institution.message}</span>}
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className={cn("text-sm", { "text-destructive": form.formState.errors.effective_date })}>
                                    Fecha Emisión <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="effective_date"
                                    control={form.control}
                                    render={({ field }) => <DatePicker selected={field.value} onSelect={field.onChange} className={cn("w-full", form.formState.errors.effective_date && "border-destructive")} />}
                                />
                                {form.formState.errors.effective_date && <span className="text-xs font-medium text-destructive block">{form.formState.errors.effective_date.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm">Vencimiento (Opcional)</Label>
                                <Controller
                                    name="expiration_date"
                                    control={form.control}
                                    render={({ field }) => <DatePicker selected={field.value || undefined} onSelect={field.onChange} className="w-full" />}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE DIALOG */}
            {itemToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteAlertOpen}
                    setOpen={setIsDeleteAlertOpen}
                    onConfirmDelete={deleteItemAction}
                    title="¿Eliminar Certificación?"
                    description={`¿Seguro que deseas eliminar "${itemToDelete.name}"?`}
                    successMessage="Certificación eliminada."
                />
            )}
        </div>
    );
}