"use client";

import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, User, Plus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PeoplePage() {
    const fields: CatalogField[] = [
        { name: "first_name", label: "Primer Nombre", type: "text", required: true },
        { name: "second_name", label: "Segundo Nombre", type: "text", required: false },
        { name: "paternal_surname", label: "Apellido Paterno", type: "text", required: true },
        { name: "maternal_surname", label: "Apellido Materno", type: "text", required: false },
        {
            name: "gender",
            label: "Género",
            type: "select",
            required: true,
            optionsUrl: "/api/core/genders/",
            optionLabelKey: "name",
            optionValueKey: "id"
        },
        {
            name: "marital_status",
            label: "Estado Civil",
            type: "select",
            required: false,
            optionsUrl: "/api/core/marital-statuses/",
            optionLabelKey: "name",
            optionValueKey: "id"
        },
        { name: "birthdate", label: "Fecha de Nacimiento", type: "date", required: true },
        {
            name: "cedula_prefix",
            label: "Prefijo Cédula",
            type: "select",
            required: false,
            options: [
                { value: "V", label: "V" },
                { value: "E", label: "E" }
            ]
        },
        { name: "cedula_number", label: "Número Cédula", type: "text", required: false },
        {
            name: "country_of_birth",
            label: "País de Nacimiento",
            type: "select",
            required: false,
            optionsUrl: "/api/core/countries/",
            optionLabelKey: "name",
            optionValueKey: "id"
        },
    ];

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "photo",
            header: "",
            cell: ({ row }) => (
                <Avatar className="h-9 w-9">
                    <AvatarImage src={row.getValue("photo")} alt={row.original.full_name} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
            ),
            enableSorting: false,
            size: 50,
        },
        {
            accessorKey: "full_name",
            header: "Nombre Completo",
            cell: ({ row }) => <div className="font-medium">{row.getValue("full_name")}</div>
        },
        {
            accessorKey: "primary_document",
            header: "Cédula",
            cell: ({ row }) => <div className="truncate">{row.getValue("primary_document")}</div>
        },
        {
            accessorKey: "primary_email",
            header: "Email",
            cell: ({ row }) => <div className="truncate">{row.getValue("primary_email")}</div>
        },
        {
            accessorKey: "primary_phone",
            header: "Teléfono",
            cell: ({ row }) => <div className="truncate">{row.getValue("primary_phone")}</div>
        },
    ];

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <CatalogCRUD
                title="Personas"
                apiUrl="/api/core/persons/"
                fields={fields}
                columns={columns}
                searchKey="search"
                searchOptions={[
                    { label: "Nombre", value: "search" }
                ]}
                disableCreate={true}
                disableEdit={true}
                customToolbarActions={
                    <Button asChild>
                        <Link href="/admin/personnel/people/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Persona
                        </Link>
                    </Button>
                }
                extraActions={(item) => (
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/personnel/people/${item.id}`} className="cursor-pointer w-full flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                        </Link>
                    </DropdownMenuItem>
                )}
            />
        </div>
    );
}
