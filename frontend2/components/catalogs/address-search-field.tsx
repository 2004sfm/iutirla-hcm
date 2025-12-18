"use client";

import { AddressAutocomplete, AddressData } from "@/components/ui/address-autocomplete";
import { UseFormReturn } from "react-hook-form";
import useSWR from "swr";
import apiClient from "@/lib/api-client";

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

interface AddressSearchFieldProps {
    value?: string;
    onChange: (value: string) => void;
    onAddressSelect?: (data: AddressData) => void;
    placeholder?: string;
    form?: UseFormReturn<any>;
}

/**
 * Wrapper component for AddressAutocomplete to work with react-hook-form
 * This component is designed to be used with CatalogCRUD's custom field type
 */
export function AddressSearchField({
    value,
    onChange,
    onAddressSelect,
    placeholder,
    form,
}: AddressSearchFieldProps) {
    // Fetch states for matching - load all to avoid pagination issues
    const { data: statesData } = useSWR("/api/core/states/?page_size=100", fetcher);
    const venezuelaStates = statesData?.results || (Array.isArray(statesData) ? statesData : []);

    const handleSelect = (addressData: AddressData) => {
        // Update the main field value (street)
        onChange(addressData.street);

        // Auto-fill related fields if form is available
        if (form) {
            console.log("🔍 Address selected from Photon:", addressData);

            // Auto-fill city
            if (addressData.city) {
                form.setValue("city", addressData.city);
                console.log("✅ Set city:", addressData.city);
            }

            // Auto-fill postal code if available
            if (addressData.postalCode) {
                form.setValue("postal_code", addressData.postalCode);
                console.log("✅ Set postal_code:", addressData.postalCode);
            }

            // Try to match state from API to database
            const statesCount = venezuelaStates.length;
            console.log(`🔎 Matching state: "${addressData.state}" against ${statesCount} available states`);

            if (addressData.state && statesCount > 0) {
                // Normalize search term
                const searchState = addressData.state.toLowerCase()
                    .replace(" state", "")
                    .replace(" estado", "")
                    .trim();

                const matchedState = venezuelaStates.find((s: any) => {
                    const dbState = s.name.toLowerCase();
                    return dbState === searchState ||
                        dbState.includes(searchState) ||
                        searchState.includes(dbState) ||
                        s.name.toLowerCase() === addressData.state.toLowerCase();
                });

                if (matchedState) {
                    form.setValue("state", matchedState.id.toString());
                    console.log(`✅ MATCH SUCCESS! "${addressData.state}" -> "${matchedState.name}" (ID: ${matchedState.id})`);
                } else {
                    console.warn(`⚠️ MATCH FAILED for "${addressData.state}". normalized="${searchState}"`);
                    console.log("Available states:", venezuelaStates.map((s: any) => s.name));
                }
            } else {
                console.warn("⚠️ Cannot match state: No states data available or no state in address");
            }

            // Log current form values
            console.log("📋 Current form values:", form.getValues());
        }

        // Notify parent if callback is provided
        if (onAddressSelect) {
            onAddressSelect(addressData);
        }
    };

    return (
        <AddressAutocomplete
            value={value}
            onSelect={handleSelect}
            placeholder={placeholder || "Buscar dirección..."}
        />
    );
}
