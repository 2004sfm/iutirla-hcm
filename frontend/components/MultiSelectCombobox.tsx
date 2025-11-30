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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { FormFieldDef } from './CatalogManager';
import { Badge } from "@/components/ui/badge";

interface SelectOption {
    id: number | string;
    [key: string]: string | number | boolean | null | undefined;
}

interface MultiSelectComboboxProps {
    field: FormFieldDef;
    value: string[] | null | undefined;
    onChange: (val: string[]) => void;
    placeholder?: string;
    hasError?: boolean;
}

export function MultiSelectCombobox({ field, value, onChange, placeholder, hasError }: MultiSelectComboboxProps) {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(() => !!field.optionsEndpoint);
    const [open, setOpen] = useState(false);

    // Convertimos el valor a array
    const selectedIds = Array.isArray(value) ? value : [];

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

    // Opciones seleccionadas
    const selectedOptions = options.filter((opt) => selectedIds.includes(String(opt.id)));

    // Toggle selection
    const toggleOption = (optionId: string) => {
        const newSelection = selectedIds.includes(optionId)
            ? selectedIds.filter(id => id !== optionId)
            : [...selectedIds, optionId];
        onChange(newSelection);
    };

    // Remove specific item
    const removeOption = (optionId: string) => {
        onChange(selectedIds.filter(id => id !== optionId));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between font-normal min-h-10 h-auto",
                            selectedIds.length === 0 && "text-muted-foreground",
                            hasError && "border-destructive focus-visible:ring-destructive hover:border-destructive/80"
                        )}
                    >
                        <div className="flex gap-1 flex-wrap">
                            {selectedIds.length === 0 ? (
                                placeholder || "Seleccione..."
                            ) : (
                                selectedOptions.map((option) => (
                                    <Badge
                                        key={option.id}
                                        variant="secondary"
                                        className="mr-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOption(String(option.id));
                                        }}
                                    >
                                        {String(option[labelKey])}
                                        <X className="ml-1 h-3 w-3" />
                                    </Badge>
                                ))
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command>
                        <CommandInput placeholder={`Buscar ${field.label.toLowerCase()}...`} />
                        <CommandList>
                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => {
                                    const isSelected = selectedIds.includes(String(option.id));
                                    return (
                                        <CommandItem
                                            key={option.id}
                                            value={String(option[labelKey])}
                                            onSelect={() => toggleOption(String(option.id))}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {String(option[labelKey])}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
