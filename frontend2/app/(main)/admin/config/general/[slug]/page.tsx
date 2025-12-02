"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { notFound } from "next/navigation";
import { use } from "react";
import { Globe, Users, Heart, MapPin, Phone, Smartphone, Mail, Building2, CreditCard, Link, Map } from "lucide-react";

interface CatalogConfig {
    title: string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
    searchOptions?: { label: string; value: string }[];
    icon?: React.ElementType;
}

const simpleNameColumns: ColumnDef<any>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div>
    },
];

const simpleNameFields: CatalogField[] = [
    {
        name: "name",
        label: "Nombre",
        type: "text",
        required: true,
    },
];

const catalogs: Record<string, CatalogConfig> = {
    countries: {
        title: "Países",
        icon: Globe,
        apiUrl: "/api/core/countries/",
        fields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "iso_2", label: "Código ISO", type: "text", required: true },
        ],
        columns: [
            { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div> },
            { accessorKey: "iso_2", header: "ISO", cell: ({ row }) => <div className="max-w-[50px] truncate">{row.getValue("iso_2")}</div> },
        ],
        searchKey: "name",
        searchOptions: [
            { label: "Nombre", value: "name" },
            { label: "Código ISO", value: "iso_2" }
        ]
    },
    genders: {
        title: "Géneros",
        icon: Users,
        apiUrl: "/api/core/genders/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "marital-statuses": {
        title: "Estados Civiles",
        icon: Heart,
        apiUrl: "/api/core/marital-statuses/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "address-types": {
        title: "Tipos de Dirección",
        icon: MapPin,
        apiUrl: "/api/core/address-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "phone-types": {
        title: "Tipos de Teléfono",
        icon: Phone,
        apiUrl: "/api/core/phone-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "phone-carriers": {
        title: "Operadoras Telefónicas",
        icon: Smartphone,
        apiUrl: "/api/core/phone-carriers/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "email-types": {
        title: "Tipos de Email",
        icon: Mail,
        apiUrl: "/api/core/email-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    banks: {
        title: "Bancos",
        icon: Building2,
        apiUrl: "/api/core/banks/",
        fields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "code", label: "Código", type: "text", required: true },
        ],
        columns: [
            { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div> },
            { accessorKey: "code", header: "Código", cell: ({ row }) => <div className="max-w-[100px] truncate">{row.getValue("code")}</div> },
        ],
        searchKey: "name",
        searchOptions: [
            { label: "Nombre", value: "name" },
            { label: "Código", value: "code" }
        ]
    },
    "bank-account-types": {
        title: "Tipos de Cuenta Bancaria",
        icon: CreditCard,
        apiUrl: "/api/core/bank-account-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "relationship-types": {
        title: "Tipos de Relación",
        icon: Link,
        apiUrl: "/api/core/relationship-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    states: {
        title: "Estados",
        icon: Map,
        apiUrl: "/api/core/states/",
        fields: [
            { name: "name", label: "Nombre", type: "text", required: true },
            {
                name: "country",
                label: "País",
                type: "select",
                required: true,
                optionsUrl: "/api/core/countries/",
                optionLabelKey: "name",
                optionValueKey: "id"
            },
        ],
        columns: [
            { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div> },
            { accessorKey: "country.name", header: "País", cell: ({ row }) => <div className="truncate">{row.original.country?.name}</div> },
        ],
        searchKey: "name",
        searchOptions: [
            { label: "Nombre", value: "name" },
            { label: "País", value: "country__name" }
        ]
    },
    "phone-carrier-codes": {
        title: "Códigos de Operadora",
        icon: Smartphone,
        apiUrl: "/api/core/phone-carrier-codes/",
        fields: [
            { name: "code", label: "Código", type: "text", required: true },
            {
                name: "carrier",
                label: "Operadora",
                type: "select",
                required: true,
                optionsUrl: "/api/core/phone-carriers/",
                optionLabelKey: "name",
                optionValueKey: "id"
            },
        ],
        columns: [
            { accessorKey: "code", header: "Código", cell: ({ row }) => <div className="truncate">{row.getValue("code")}</div> },
            { accessorKey: "carrier.name", header: "Operadora", cell: ({ row }) => <div className="truncate">{row.original.carrier?.name}</div> },
        ],
        searchKey: "code",
        searchOptions: [
            { label: "Código", value: "code" },
            { label: "Operadora", value: "carrier__name" }
        ]
    },
};

export default function DynamicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const config = catalogs[slug];

    if (!config) {
        notFound();
    }

    return (
        <CatalogCRUD
            title={config.title}
            icon={config.icon}
            apiUrl={config.apiUrl}
            fields={config.fields}
            columns={config.columns}
            searchKey={config.searchKey}
            searchOptions={config.searchOptions}
        />
    );
}
