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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Pencil, AlertCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { Separator } from "@/components/ui/separator";

// --- ESQUEMAS DE VALIDACIÓN ---

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

const addressSchema = z.object({
    address_type: z.string().min(1, "Seleccione el tipo de dirección."),
    country: z.string().min(1, "Seleccione el país."),
    state: z.string().min(1, "Seleccione el estado."),
    city: z.string().min(2, "La ciudad es obligatoria."),
    postal_code: z.string().optional().nullable(),
    street_name_and_number: z.string().min(5, "La dirección principal es obligatoria."),
    extra_address_line: z.string().optional().nullable(),
    house_number: z.string().optional().nullable(),
    apartment: z.string().optional().nullable(),
    street_2: z.string().optional().nullable(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface PersonAddressManagerProps { personId: number; }

interface AddressItem {
    id: number;
    address_type: number;
    country: number;
    state: number;
    city: string;
    postal_code: string | null;
    street_name_and_number: string;
    // Campos expandidos para la tabla
    address_type_name?: string;
    country_name?: string;
    state_name?: string;
    [key: string]: any;
}

export function PersonAddressManager({ personId }: PersonAddressManagerProps) {
    const [addresses, setAddresses] = useState<AddressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverError, setServerError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            address_type: "", country: "", state: "", city: "",
            postal_code: "", street_name_and_number: "",
            extra_address_line: "", house_number: "", apartment: "", street_2: ""
        }
    });

    const { watch, reset, setError, handleSubmit, control, formState: { errors } } = form;
    const selectedCountryId = watch('country');

    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/api/core/addresses/?person=${personId}`);
            setAddresses(res.data.results || res.data);
        } catch (err) {
            toast.error("Error al cargar direcciones.");
        } finally {
            setLoading(false);
        }
    }, [personId]);

    useEffect(() => { if (personId) fetchData(); }, [personId, fetchData]);

    // --- MANEJO DE ERRORES ---
    const handleServerError = (err: AxiosError<DjangoErrorResponse>) => {
        const responseData = err.response?.data;

        if (responseData && typeof responseData === 'object') {
            let globalErrors: string[] = [];

            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                if (key in form.getValues()) {
                    // Si el campo existe, lo asignamos para que salga debajo del input
                    form.setError(key as keyof AddressFormData, { type: 'server', message: errorText });
                } else if (key === 'non_field_errors' || key === 'detail') {
                    globalErrors.push(errorText);
                }
            });

            if (globalErrors.length > 0) {
                setServerError(globalErrors.join('\n'));
            }
        } else {
            setServerError("Ocurrió un error de conexión o del servidor.");
        }
    };

    // --- MANEJADORES DE MODAL ---

    const handleCreate = () => {
        setEditingId(null);
        setServerError(null);
        reset(); // Limpia el formulario
        setIsModalOpen(true);
    };

    const handleEdit = (item: AddressItem) => {
        setEditingId(item.id);
        setServerError(null);
        // Mapeo inverso de IDs a strings para el Combobox
        reset({
            address_type: String(item.address_type),
            country: String(item.country),
            state: String(item.state),
            city: item.city,
            postal_code: item.postal_code,
            street_name_and_number: item.street_name_and_number,
            extra_address_line: item.extra_address_line,
            house_number: item.house_number,
            apartment: item.apartment,
            street_2: item.street_2,
        });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: AddressFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            // Limpieza y preparación del payload
            const payload = Object.fromEntries(
                Object.entries(data).filter(([k, v]) => v !== "" && v !== null && v !== undefined)
            );

            // Aseguramos que personId esté en el payload
            const finalPayload = { ...payload, person: personId };

            if (editingId) {
                await apiClient.patch(`/api/core/addresses/${editingId}/`, finalPayload);
                toast.success("Dirección actualizada.");
            } else {
                await apiClient.post('/api/core/addresses/', finalPayload);
                toast.success("Dirección agregada.");
            }
            setIsModalOpen(false);
            fetchData();

        } catch (err) {
            if (err instanceof AxiosError) handleServerError(err);
            else setServerError("Error inesperado.");
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar esta dirección?")) return;
        try { await apiClient.delete(`/api/core/addresses/${id}/`); fetchData(); }
        catch { toast.error("Error al eliminar."); }
    };


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Direcciones</h3>
                <Button size="sm" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Agregar Dirección</Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>País / Estado</TableHead>
                            <TableHead>Dirección Completa</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {addresses.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin direcciones registradas.</TableCell></TableRow> :
                            addresses.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-sm">
                                        {item.address_type_name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{item.country_name}</div>
                                        <div className="text-xs text-muted-foreground">{item.state_name}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {item.street_name_and_number}, {item.city} {item.postal_code}
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

            {/* --- MODAL DE DIRECCIÓN --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader><DialogTitle>{editingId ? "Editar Dirección" : "Nueva Dirección"}</DialogTitle></DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

                        {serverError && <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Atención</AlertTitle><AlertDescription>{serverError}</AlertDescription></Alert>}

                        <div className="grid grid-cols-2 gap-4">
                            {/* TIPO DE DIRECCIÓN */}
                            <div className="space-y-1">
                                <Label className={errors.address_type ? "text-destructive" : ""}>Tipo <span className="text-destructive">*</span></Label>
                                <Controller name="address_type" control={control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'address_type', label: 'Tipo de Dirección', type: 'select', optionsEndpoint: '/api/core/address-types/' }} value={field.value} onChange={field.onChange} placeholder="Casa, Trabajo..." hasError={!!errors.address_type} />
                                )} />
                                {errors.address_type && <span className="text-xs font-medium text-destructive block mt-1">{errors.address_type.message}</span>}
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-4">
                            {/* PAÍS */}
                            <div className="space-y-1">
                                <Label className={errors.country ? "text-destructive" : ""}>País <span className="text-destructive">*</span></Label>
                                <Controller name="country" control={control} render={({ field }) => (
                                    <DynamicCombobox field={{ name: 'country', label: 'País', type: 'select', optionsEndpoint: '/api/core/countries/' }} value={field.value} onChange={field.onChange} placeholder="Buscar..." hasError={!!errors.country} />
                                )} />
                                {errors.country && <span className="text-xs font-medium text-destructive block mt-1">{errors.country.message}</span>}
                            </div>

                            {/* ESTADO (Dependiente de País) */}
                            <div className="space-y-1">
                                <Label className={errors.state ? "text-destructive" : ""}>Estado <span className="text-destructive">*</span></Label>
                                <Controller name="state" control={control} render={({ field }) => (
                                    <DynamicCombobox
                                        field={{
                                            name: 'state',
                                            label: 'Estado',
                                            type: 'select',
                                            // Filtra por el país seleccionado
                                            optionsEndpoint: selectedCountryId ? `/api/core/states/?country=${selectedCountryId}` : '/api/core/states/',
                                            optionsLabelKey: 'name'
                                        }}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Buscar..."
                                        hasError={!!errors.state}
                                    />
                                )} />
                                {errors.state && <span className="text-xs font-medium text-destructive block mt-1">{errors.state.message}</span>}
                            </div>

                            {/* CIUDAD */}
                            <div className="space-y-1">
                                <Label className={errors.city ? "text-destructive" : ""}>Ciudad <span className="text-destructive">*</span></Label>
                                <Input {...form.register("city")} placeholder="Ej: Caracas" className={errors.city ? "border-destructive" : ""} />
                                {errors.city && <span className="text-xs font-medium text-destructive block mt-1">{errors.city.message}</span>}
                            </div>
                        </div>

                        {/* DETALLE DE CALLE */}
                        <div className="space-y-1">
                            <Label className={errors.street_name_and_number ? "text-destructive" : ""}>Calle y Número Principal <span className="text-destructive">*</span></Label>
                            <Input {...form.register("street_name_and_number")} placeholder="Ej: Av. Francisco de Miranda, Edificio X" className={errors.street_name_and_number ? "border-destructive" : ""} />
                            {errors.street_name_and_number && <span className="text-xs font-medium text-destructive block mt-1">{errors.street_name_and_number.message}</span>}
                        </div>

                        {/* DETALLE ADICIONAL */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1 col-span-2">
                                <Label>Línea Adicional (Opcional)</Label>
                                <Input {...form.register("extra_address_line")} placeholder="Ej: Cerca de la plaza..." />
                            </div>
                            <div className="space-y-1 col-span-1">
                                <Label>Nro Casa/Edif.</Label>
                                <Input {...form.register("house_number")} placeholder="Ej: 15" />
                            </div>
                            <div className="space-y-1 col-span-1">
                                <Label>Cód. Postal</Label>
                                <Input {...form.register("postal_code")} placeholder="Ej: 1010" />
                            </div>
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