"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { notFound } from "next/navigation";
import { use } from "react";

interface CatalogConfig {
    title: string;
    apiUrl: string;
    fields: CatalogField[];
    columns: ColumnDef<any>[];
    searchKey?: string;
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
    },
    genders: {
        title: "Géneros",
        apiUrl: "/api/core/genders/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "marital-statuses": {
        title: "Estados Civiles",
        apiUrl: "/api/core/marital-statuses/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "address-types": {
        title: "Tipos de Dirección",
        apiUrl: "/api/core/address-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "phone-types": {
        title: "Tipos de Teléfono",
        apiUrl: "/api/core/phone-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "phone-carriers": {
        title: "Operadoras Telefónicas",
        apiUrl: "/api/core/phone-carriers/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "email-types": {
        title: "Tipos de Email",
        apiUrl: "/api/core/email-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    banks: {
        title: "Bancos",
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
    },
    "bank-account-types": {
        title: "Tipos de Cuenta Bancaria",
        apiUrl: "/api/core/bank-account-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    "relationship-types": {
        title: "Tipos de Relación",
        apiUrl: "/api/core/relationship-types/",
        fields: simpleNameFields,
        columns: simpleNameColumns,
        searchKey: "name",
    },
    states: {
        title: "Estados",
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
    },
    "phone-carrier-codes": {
        title: "Códigos de Operadora",
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
            apiUrl={config.apiUrl}
            fields={config.fields}
            columns={config.columns}
            searchKey={config.searchKey}
        />
    );
}
