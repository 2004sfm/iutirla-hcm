'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { AxiosError } from 'axios';
import { cn } from "@/lib/utils";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Pencil, AlertCircle, Star, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DynamicCombobox } from "@/components/DynamicCombobox";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

interface DjangoErrorResponse {
    [key: string]: string[] | string | undefined;
    non_field_errors?: string[];
    detail?: string;
}

const bankAccountSchema = z.object({
    bank: z.string().min(1, "Seleccione el banco."),
    bank_account_type: z.string().min(1, "Seleccione el tipo de cuenta."),
    account_number: z.string()
        .length(16, "Debe ingresar los 16 dígitos restantes.")
        .regex(/^\d+$/, "Solo números."),
    is_primary: z.boolean(),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface PersonBankAccountManagerProps {
    personId: number;
}

interface BankAccountItem {
    id: number;
    bank: number;
    bank_name: string;
    bank_code: string;
    bank_account_type: number;
    bank_account_type_name: string;
    account_number: string;
    is_primary: boolean;
}

interface BankData {
    id: number;
    name: string;
    code: string;
}

export function PersonBankAccountManager({ personId }: PersonBankAccountManagerProps) {
    const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

    // Estado para el código del banco seleccionado
    const [selectedBankCode, setSelectedBankCode] = useState<string>("");

    const form = useForm<BankAccountFormData>({
        resolver: zodResolver(bankAccountSchema) as Resolver<BankAccountFormData>,
        defaultValues: {
            bank: "",
            bank_account_type: "",
            account_number: "",
            is_primary: false
        }
    });

    const { formState: { errors }, clearErrors, watch, setValue } = form;
    const watchedBankId = watch('bank');

    // Efecto para buscar el código del banco cuando cambia la selección
    useEffect(() => {
        const fetchBankCode = async () => {
            if (!watchedBankId) {
                setSelectedBankCode("");
                return;
            }

            // Si estamos editando y el banco es el mismo que el original, usamos el código que ya tenemos (si lo tuviéramos)
            // Pero como BankAccountItem ahora tiene bank_code, podemos optimizar.
            // Sin embargo, para simplificar y asegurar consistencia, hacemos fetch o buscamos en cache si implementáramos cache.
            // Dado que DynamicCombobox no expone la data completa fácilmente, hacemos un fetch rápido.

            try {
                const res = await apiClient.get<BankData>(`/api/core/banks/${watchedBankId}/`);
                setSelectedBankCode(res.data.code);
            } catch (err) {
                console.error("Error fetching bank details", err);
                setSelectedBankCode("????");
            }
        };

        // Solo hacer fetch si el ID cambió y no es vacío
        if (watchedBankId) {
            // Pequeña optimización: si estamos editando y el ID coincide con el item editado, usamos ese código
            // Pero necesitamos acceso al item editado aquí... mejor hacemos el fetch, es rápido.
            fetchBankCode();
        } else {
            setSelectedBankCode("");
        }
    }, [watchedBankId]);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/api/core/person-bank-accounts/?person=${personId}`);
            setAccounts(res.data.results || res.data);
        } catch (err) {
            toast.error("Error al cargar cuentas bancarias.");
        } finally {
            setLoading(false);
        }
    }, [personId]);

    useEffect(() => {
        if (personId) fetchAccounts();
    }, [personId, fetchAccounts]);

    const handleServerError = (err: AxiosError<DjangoErrorResponse>) => {
        const responseData = err.response?.data;
        const status = err.response?.status;

        if (responseData && typeof responseData === 'object') {
            const globalErrors: string[] = [];
            const formValues = form.getValues();

            Object.entries(responseData).forEach(([key, msgs]) => {
                const errorText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);

                if (key === 'is_primary' || key === 'non_field_errors') {
                    globalErrors.push(errorText);
                } else if (key in formValues) {
                    form.setError(key as keyof typeof formValues, { type: 'server', message: errorText });
                } else {
                    globalErrors.push(errorText);
                }
            });

            if (globalErrors.length > 0) {
                setServerError(globalErrors.join('\n'));
            }
        } else {
            setServerError(`Ocurrió un problema de conexión o del servidor (${status || 'Desconocido'}).`);
        }
    };

    const handleCreate = () => {
        setEditingId(null);
        setServerError(null);
        setSelectedBankCode("");
        clearErrors();
        form.reset({ bank: "", bank_account_type: "", account_number: "", is_primary: false });
        setIsModalOpen(true);
    };

    const handleEdit = (item: BankAccountItem) => {
        setEditingId(item.id);
        setServerError(null);
        clearErrors();

        // El código del banco son los primeros 4 dígitos
        // El número editable son los últimos 16
        // Asumimos que item.account_number tiene 20 dígitos
        const code = item.bank_code || item.account_number.substring(0, 4);
        const number = item.account_number.substring(4);

        setSelectedBankCode(code);

        form.reset({
            bank: String(item.bank),
            bank_account_type: String(item.bank_account_type),
            account_number: number,
            is_primary: item.is_primary
        });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: BankAccountFormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            // Concatenar código del banco + número ingresado
            const fullAccountNumber = `${selectedBankCode}${data.account_number}`;

            const payload = {
                ...data,
                account_number: fullAccountNumber,
                person: personId
            };

            if (editingId) {
                await apiClient.patch(`/api/core/person-bank-accounts/${editingId}/`, payload);
                toast.success("Cuenta bancaria actualizada exitosamente");
            } else {
                await apiClient.post('/api/core/person-bank-accounts/', payload);
                toast.success("Cuenta bancaria agregada exitosamente");
            }

            setIsModalOpen(false);
            fetchAccounts();
        } catch (err) {
            if (err instanceof AxiosError) handleServerError(err);
            else setServerError("Error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        setAccountToDelete(id);
        setIsDeleteAlertOpen(true);
    };

    const deleteAccountAction = useCallback(async () => {
        if (!accountToDelete) return;
        await apiClient.delete(`/api/core/person-bank-accounts/${accountToDelete}/`);
        fetchAccounts();
    }, [accountToDelete, fetchAccounts]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    Cuentas Bancarias
                </h3>
                <Button type="button" size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Banco</TableHead>
                            <TableHead>Tipo de Cuenta</TableHead>
                            <TableHead>Número de Cuenta</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : accounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    Sin cuentas bancarias.
                                </TableCell>
                            </TableRow>
                        ) : (
                            accounts.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.bank_name || "—"}</TableCell>
                                    <TableCell>{item.bank_account_type_name || "—"}</TableCell>
                                    <TableCell className="font-mono text-sm">{item.account_number}</TableCell>
                                    <TableCell>
                                        {item.is_primary ? (
                                            <Badge className="bg-chart-2 hover:bg-chart-2/90 text-[10px] w-24 justify-center">
                                                <Star className="h-3 w-3 mr-1 fill-current" /> PRINCIPAL
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] w-24 justify-center text-muted-foreground">
                                                SECUNDARIA
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
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

            {/* MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4 py-2">
                        {serverError && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap text-sm">
                                    {serverError}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1">
                            <Label className={cn("text-sm", errors.bank && "text-destructive")}>
                                Banco <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="bank"
                                control={form.control}
                                render={({ field }) => (
                                    <DynamicCombobox
                                        field={{ name: 'bank', label: 'Banco', type: 'select', optionsEndpoint: '/api/core/banks/' }}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Seleccione el banco..."
                                        hasError={!!errors.bank}
                                    />
                                )}
                            />
                            {errors.bank && <span className="text-xs font-medium text-destructive block mt-1">{errors.bank.message}</span>}
                        </div>

                        <div className="space-y-1">
                            <Label className={cn("text-sm", errors.bank_account_type && "text-destructive")}>
                                Tipo de Cuenta <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="bank_account_type"
                                control={form.control}
                                render={({ field }) => (
                                    <DynamicCombobox
                                        field={{ name: 'bank_account_type', label: 'Tipo', type: 'select', optionsEndpoint: '/api/core/bank-account-types/' }}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Corriente, Ahorro..."
                                        hasError={!!errors.bank_account_type}
                                    />
                                )}
                            />
                            {errors.bank_account_type && <span className="text-xs font-medium text-destructive block mt-1">{errors.bank_account_type.message}</span>}
                        </div>

                        <div className="space-y-1">
                            <Label className={cn("text-sm", errors.account_number && "text-destructive")}>
                                Número de Cuenta <span className="text-destructive">*</span>
                            </Label>

                            <div className="flex items-center gap-2">
                                {/* Bank Code Prefix */}
                                <div className="flex-shrink-0 w-16 h-10 rounded-md border bg-muted flex items-center justify-center font-mono text-sm text-muted-foreground select-none" title="Código del Banco">
                                    {selectedBankCode || "----"}
                                </div>

                                <Input
                                    {...form.register("account_number")}
                                    placeholder="0000000000000000"
                                    maxLength={16}
                                    className={cn(
                                        "flex-1 text-sm font-mono",
                                        errors.account_number && "border-destructive"
                                    )}
                                />
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Código de banco + 16 dígitos</span>
                                <span>{watch('account_number')?.length || 0}/16</span>
                            </div>

                            {errors.account_number && (
                                <span className="text-xs font-medium text-destructive block mt-1">
                                    {errors.account_number.message}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded border">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is-primary"
                                    checked={form.watch('is_primary')}
                                    onCheckedChange={(v) => form.setValue('is_primary', v)}
                                />
                                <Label htmlFor="is-primary" className="text-sm cursor-pointer">
                                    Cuenta Principal
                                </Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !selectedBankCode}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                {editingId ? "Guardar Cambios" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                open={isDeleteAlertOpen}
                setOpen={setIsDeleteAlertOpen}
                onConfirmDelete={deleteAccountAction}
                title="¿Eliminar Cuenta Bancaria?"
                description="Se eliminará esta cuenta permanentemente."
                successMessage="Cuenta bancaria eliminada exitosamente."
            />
        </div>
    );
}
