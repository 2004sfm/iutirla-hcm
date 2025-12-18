"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface PhotonProperties {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
}

interface PhotonFeature {
    properties: PhotonProperties;
    geometry: {
        coordinates: [number, number]; // [lon, lat]
    };
}

interface PhotonResponse {
    features: PhotonFeature[];
}

export interface AddressData {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
}

interface AddressAutocompleteProps {
    value?: string;
    onSelect: (address: AddressData) => void;
    placeholder?: string;
    className?: string;
}

export function AddressAutocomplete({
    value = "",
    onSelect,
    placeholder = "Buscar dirección...",
    className,
}: AddressAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(value);
    const [results, setResults] = useState<PhotonFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Venezuela bounding box: lon_min, lat_min, lon_max, lat_max
                // Approximate coordinates: West: -73.4, South: 0.6, East: -59.8, North: 12.2
                const venezuelaBbox = "-73.4,0.6,-59.8,12.2";

                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5&bbox=${venezuelaBbox}`
                );
                const data: PhotonResponse = await response.json();
                setResults(data.features || []);
            } catch (error) {
                console.error("Error fetching addresses:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelect = useCallback((feature: PhotonFeature) => {
        const { properties, geometry } = feature;

        // La calle puede venir en properties.street o properties.name
        const street = properties.street || properties.name || "";
        const city = properties.city || "";
        const state = properties.state || "";
        const postalCode = properties.postcode || "";
        const [longitude, latitude] = geometry.coordinates;

        const addressData: AddressData = {
            street,
            city,
            state,
            postalCode,
            latitude,
            longitude,
        };

        onSelect(addressData);

        // Update display value
        const displayValue = `${street}${city ? `, ${city}` : ""}${state ? `, ${state}` : ""}`;
        setSearchQuery(displayValue);
        setOpen(false);
    }, [onSelect]);

    const formatFeatureLabel = (feature: PhotonFeature): string => {
        const { properties } = feature;
        const parts = [
            properties.street || properties.name,
            properties.city,
            properties.state,
            properties.country,
        ].filter(Boolean);
        return parts.join(", ");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between text-left font-normal",
                        !searchQuery && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {searchQuery || placeholder}
                    </span>
                    {isLoading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={placeholder}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!isLoading && searchQuery.length >= 3 && results.length === 0 && (
                            <CommandEmpty>No se encontraron direcciones.</CommandEmpty>
                        )}
                        {!isLoading && searchQuery.length < 3 && searchQuery.length > 0 && (
                            <CommandEmpty>Escribe al menos 3 caracteres...</CommandEmpty>
                        )}
                        {!isLoading && results.length > 0 && (
                            <CommandGroup>
                                {results.map((feature, index) => (
                                    <CommandItem
                                        key={index}
                                        value={formatFeatureLabel(feature)}
                                        onSelect={() => handleSelect(feature)}
                                        className="cursor-pointer"
                                    >
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">
                                            {formatFeatureLabel(feature)}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
