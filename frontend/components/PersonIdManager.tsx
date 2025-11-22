'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, FileText, Star, BadgeCheck, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Interfaz para errores de Django
interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

const nationalIdSchema = z.object({
    category: z.string().min(1, "Seleccione la categoría."),
    document_type: z.string().min(1, "Seleccione el prefijo."),
    id_number: z.string().min(1, "El número es obligatorio."),
    is_primary: z.boolean(),
});

type NationalIdFormData = z.infer<typeof nationalIdSchema>;

interface PersonIdManagerProps { personId: number; }

interface NationalIdItem {
    id: number;
    category: string;
    document_type: string;
    number: string;
    is_primary: boolean;
    file: string | null;
}

const DOC_CATEGORIES = [
    { value: 'CEDULA', label: 'Cédula de Identidad' },
    { value: 'RIF', label: 'RIF' },
    { value: 'PASSPORT', label: 'Pasaporte' },
];

const PREFIX_OPTIONS: Record<string, { value: string; label: string }[]> = {
    'CEDULA': [{ value: 'V', label: 'V' }, { value: 'E', label: 'E' }],
    'RIF': [{ value: 'V', label: 'V' }, { value: 'E', label: 'E' }, { value: 'J', label: 'J' }, { value: 'G', label: 'G' }],
    'PASSPORT': [{ value: 'P', label: 'P' }]
};

export function PersonIdManager({ personId }: PersonIdManagerProps) {
    const [ids, setIds] = useState<NationalIdItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado para Errores Globales
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<NationalIdFormData>({
        resolver: zodResolver(nationalIdSchema) as Resolver<NationalIdFormData>,
        defaultValues: {
            category: "CEDULA",
            document_type: "V",
            id_number: "",
            is_primary: false
        }
    });

    const { setError, clearErrors, setValue, watch, formState: { errors }, reset, control, register } = form;
    const selectedCategory = watch('category');

    useEffect(() => {
        if (isModalOpen && !editingId) {
            if (selectedCategory === 'CEDULA') setValue('document_type', 'V');
            else if (selectedCategory === 'RIF') setValue('document_type', 'V');
            else if (selectedCategory === 'PASSPORT') setValue('document_type', 'P');
        }
    }, [selectedCategory, isModalOpen, setValue, editingId]);

    const fetchIds = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/api/core/national-ids/?person=${personId}`);
            setIds(res.data.results || res.data);
        } catch { toast.error("Error al cargar documentos."); } finally { setLoading(false); }
    }, [personId]);

    useEffect(() => { if (personId) fetchIds(); }, [personId, fetchIds]);

    const handleCreate = () => {
        setEditingId(null);
        setServerError(null);
        clearErrors();
        reset({ category: "CEDULA", document_type: "V", id_number: "", is_primary: false });
        setFile(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: NationalIdItem) => {
        setEditingId(item.id);
        setServerError(null);
        clearErrors();
        reset({
            category: item.category,
            document_type: item.document_type,
            id_number: item.number,
            is_primary: item.is_primary
        });
        setFile(null);
        setIsModalOpen(true);
    };

    const handleServerError = (err: AxiosError<DjangoErrorResponse>) => {
        const responseData = err.response?.data;
        const status = err.response?.status;

        if (responseData && typeof responseData === 'object') {
            const rawString = JSON.stringify(responseData).toLowerCase();

            // 1. Errores globales de unicidad
            if (rawString.includes('conjunto único') || rawString.includes('unique set') || rawString.includes('must make a unique set')) {
                setServerError("Este documento ya se encuentra registrado.");
                return;
            }

            const globalErrors: string[] = [];

            // 2. Asignación de errores a campos
            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                let fieldName: keyof NationalIdFormData | null = null;
                if (key === 'number') fieldName = 'id_number';
                else if (key === 'category') fieldName = 'category';
                else if (key === 'document_type') fieldName = 'document_type';
                else if (key === 'is_primary') fieldName = 'is_primary';

                if (fieldName) {
                    setError(fieldName, { type: 'server', message: errorText });
                } else {
                    if (key !== 'non_field_errors') {
                        globalErrors.push(`${key}: ${errorText}`);
                    } else {
                        globalErrors.push(errorText);
                    }
                }
            });

            if (globalErrors.length > 0) {
                setServerError(globalErrors.join('\n'));
            }

        } else {
            setServerError(`Ocurrió un problema de conexión o del servidor (${status || 'Desconocido'}).`);
        }
    };

    const onSubmit = async (data: NationalIdFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const formData = new FormData();
            formData.append('person', String(personId));
            formData.append('category', data.category);
            formData.append('document_type', data.document_type);
            formData.append('number', data.id_number);
            formData.append('is_primary', data.is_primary ? 'true' : 'false');

            if (file) {
                formData.append('file', file);
            }

            const config = { headers: { "Content-Type": null as unknown as string } };

            if (editingId) {
                await apiClient.patch(`/api/core/national-ids/${editingId}/`, formData, config);
                toast.success("Documento actualizado.");
            } else {
                await apiClient.post('/api/core/national-ids/', formData, config);
                toast.success("Documento agregado.");
            }

            setIsModalOpen(false);
            fetchIds();

        } catch (err) {
            if (err instanceof AxiosError) {
                handleServerError(err as AxiosError<DjangoErrorResponse>);
            } else {
                setServerError("Ocurrió un error inesperado.");
            }
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar documento?")) return;
        try { await apiClient.delete(`/api/core/national-ids/${id}/`); fetchIds(); } catch { toast.error("Error al eliminar."); }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /> Identificaciones</h3>
                <Button size="sm" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Agregar</Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Soporte</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ids.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin registros.</TableCell></TableRow> :
                            ids.map((item) => (
                                <TableRow key={item.id}>
                                    {/* TRADUCCIÓN EN TABLA */}
                                    <TableCell className="font-medium text-sm">
                                        {DOC_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                                    </TableCell>
                                    <TableCell className="font-mono text-base">{item.document_type}-{item.number}</TableCell>
                                    <TableCell>
                                        {item.is_primary ? (
                                            <Badge className="bg-chart-2 hover:bg-chart-2/90 text-[10px]"><Star className="h-3 w-3 mr-1 fill-current" /> PRINCIPAL</Badge>
                                        ) : <Badge variant="secondary" className="text-[10px] text-muted-foreground">SECUNDARIO</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        {item.file ? (
                                            <a href={item.file} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm"><FileText className="h-4 w-4 mr-1" /> Ver</a>
                                        ) : <span className="text-xs italic text-muted-foreground opacity-50">---</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Documento" : "Nuevo Documento"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">

                        {/* ALERT ROJO GLOBAL (Para errores que no son de campos) */}
                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap text-sm">
                                    {serverError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* CAMPO: CATEGORÍA */}
                        <div className="space-y-1">
                            <Label className={errors.category ? "text-destructive" : ""}>
                                Categoría <span className="text-destructive">*</span>
                            </Label>

                            <Controller name="category" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className={`w-full ${errors.category ? "border-destructive focus:ring-destructive" : ""}`}><SelectValue /></SelectTrigger>
                                    <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                </Select>
                            )} />

                            {/* ERROR DEBAJO DEL INPUT */}
                            {errors.category && <span className="text-xs font-medium text-destructive block mt-1">{errors.category.message}</span>}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* CAMPO: PREFIJO */}
                            <div className="col-span-1 space-y-1">
                                <Label className={errors.document_type ? "text-destructive" : ""}>Prefijo</Label>

                                <Controller name="document_type" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className={`w-full ${errors.document_type ? "border-destructive" : ""}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>{PREFIX_OPTIONS[selectedCategory]?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                )} />

                                {/* ERROR DEBAJO DEL INPUT */}
                                {errors.document_type && <span className="text-xs font-medium text-destructive block mt-1">{errors.document_type.message}</span>}
                            </div>

                            {/* CAMPO: NÚMERO */}
                            <div className="col-span-2 space-y-1">
                                <Label className={errors.id_number ? "text-destructive" : ""}>
                                    Número <span className="text-destructive">*</span>
                                </Label>

                                <Input
                                    {...register("id_number")}
                                    placeholder="Ej: 12345678"
                                    className={`w-full ${errors.id_number ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />

                                {/* ERROR DEBAJO DEL INPUT */}
                                {errors.id_number && (
                                    <span className="text-xs font-medium text-destructive block mt-1">
                                        {errors.id_number.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label>Soporte (Opcional)</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.png" className="w-full text-xs cursor-pointer" />
                        </div>

                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded border">
                            <div className="flex items-center space-x-2">
                                <Switch id="is-primary" checked={watch('is_primary')} onCheckedChange={(v) => setValue('is_primary', v)} />
                                <Label htmlFor="is-primary" className={`text-sm cursor-pointer ${errors.is_primary ? "text-destructive" : ""}`}>
                                    Documento Principal
                                </Label>
                            </div>

                            {/* ERROR DEBAJO DEL INPUT */}
                            {errors.is_primary && (
                                <span className="text-xs font-medium text-destructive block mb-1 px-2">
                                    {errors.is_primary.message}
                                </span>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (editingId ? "Guardar Cambios" : "Guardar")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}