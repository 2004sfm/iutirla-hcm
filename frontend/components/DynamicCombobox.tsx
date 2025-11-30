'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { FormFieldDef } from './CatalogManager';

interface SelectOption {
    id: number | string;
    [key: string]: string | number | boolean | null | undefined;
}

interface DynamicComboboxProps {
    field: FormFieldDef;
    value: string | number | boolean | null | undefined;
    onChange: (val: string | null) => void;
    placeholder?: string;
    hasError?: boolean;
}

export function DynamicCombobox({ field, value, onChange, placeholder, hasError }: DynamicComboboxProps) {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(() => !!field.optionsEndpoint);
    const [open, setOpen] = useState(false);

    // Convertimos el valor actual a string para comparaciones seguras
    const stringValue = (value !== null && value !== undefined && value !== '')
        ? String(value)
        : "";

    useEffect(() => {
        if (!field.optionsEndpoint) return;
        let isMounted = true;

        const separator = field.optionsEndpoint.includes('?') ? '&' : '?';
        const url = `${field.optionsEndpoint}${separator}page_size=100`;

        apiClient.get(url)
            .then(res => {
                if (isMounted) {
                    const data = Array.isArray(res.data) ? res.data : res.data.results || [];
                    setOptions(data as SelectOption[]);
                }
            })
            .catch(err => console.error(`Error cargando opciones ${field.name}`, err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [field.optionsEndpoint, field.name]);

    if (loading) {
        return <Skeleton className="h-10 w-full rounded-md" />;
    }

    const labelKey = field.optionsLabelKey || 'name';

    // Buscamos el label del item seleccionado para mostrarlo en el botón
    const selectedLabel = options.find((opt) => String(opt.id) === stringValue)?.[labelKey];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal",
                        !stringValue && "text-muted-foreground",
                        hasError && "border-destructive focus-visible:ring-destructive hover:border-destructive/80"
                    )}
                >
                    {selectedLabel
                        ? String(selectedLabel)
                        : (placeholder || "Seleccione...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Buscar ${field.label.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                        <CommandGroup>
                            {/* Opción Ninguno para campos opcionales */}
                            {!field.required && (
                                <CommandItem
                                    value="_NULL_"
                                    onSelect={() => {
                                        onChange(null);
                                        setOpen(false);
                                    }}
                                    className="text-muted-foreground"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            stringValue === "" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Ninguno
                                </CommandItem>
                            )}

                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={String(option[labelKey])}
                                    onSelect={() => {
                                        onChange(String(option.id));
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            stringValue === String(option.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {String(option[labelKey])}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}