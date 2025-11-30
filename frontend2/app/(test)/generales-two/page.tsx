"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Globe2,
    Map,
    Users,
    HeartHandshake,
    MapPin,
    Phone,
    Cpu,
    Mail,
    Landmark,
    Wallet,
    Share2,
    Search,
    Hash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const catalogs = [
    {
        title: "Países",
        description: "Gestión de países para direcciones y nacionalidades",
        icon: Globe2,
        href: "/admin/config/general/countries",
    },
    {
        title: "Estados",
        description: "Gestión de estados y provincias por país",
        icon: Map,
        href: "/admin/config/general/states",
    },
    {
        title: "Géneros",
        description: "Catálogo de géneros e identidades",
        icon: Users,
        href: "/admin/config/general/genders",
    },
    {
        title: "Estado Civil",
        description: "Tipos de estado civil",
        icon: HeartHandshake,
        href: "/admin/config/general/marital-statuses",
    },
    {
        title: "Tipos de Dirección",
        description: "Clasificación de direcciones (Casa, Trabajo, etc.)",
        icon: MapPin,
        href: "/admin/config/general/address-types",
    },
    {
        title: "Tipos de Teléfono",
        description: "Clasificación de teléfonos (Móvil, Fijo, etc.)",
        icon: Phone,
        href: "/admin/config/general/phone-types",
    },
    {
        title: "Operadoras",
        description: "Operadoras de telefonía móvil y fija",
        icon: Cpu,
        href: "/admin/config/general/phone-carriers",
    },
    {
        title: "Tipos de Email",
        description: "Clasificación de correos (Personal, Corporativo)",
        icon: Mail,
        href: "/admin/config/general/email-types",
    },
    {
        title: "Bancos",
        description: "Instituciones bancarias y financieras",
        icon: Landmark,
        href: "/admin/config/general/banks",
    },
    {
        title: "Tipos de Cuenta",
        description: "Tipos de cuenta bancaria (Ahorro, Corriente)",
        icon: Wallet,
        href: "/admin/config/general/bank-account-types",
    },
    {
        title: "Tipos de Relación",
        description: "Parentescos y tipos de relación familiar",
        icon: Share2,
        href: "/admin/config/general/relationship-types",
    },
    {
        title: "Códigos de Operadora",
        description: "Códigos de área por operadora telefónica",
        icon: Hash,
        href: "/admin/config/general/phone-carrier-codes",
    }
];

export default function GeneralConfigPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const normalizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredCatalogs = catalogs.filter(catalog =>
        normalizeText(catalog.title).includes(normalizeText(searchQuery)) ||
        normalizeText(catalog.description).includes(normalizeText(searchQuery))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Catálogos Generales</h1>
                    <p className="text-muted-foreground">
                        Configuración de catálogos base del sistema
                    </p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar catálogos..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCatalogs.map((catalog) => (
                    <Link key={catalog.href} href={catalog.href}>
                        <Card className="relative h-[140px] flex flex-col p-5 overflow-hidden bg-primary hover:scale-105 hover:contrast-125 hover:shadow-xl transition-all duration-300 ease-out group cursor-pointer text-primary-foreground border-0">
                            <div className="h-full relative z-10 flex flex-col justify-between gap-1">
                                <CardHeader className="p-0 space-y-0">
                                    <CardTitle className="mr-20 text-xl font-bold leading-tight">
                                        {catalog.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <CardDescription className="mr-26 text-primary-foreground/90 text-sm font-medium line-clamp-2">
                                        {catalog.description}
                                    </CardDescription>
                                </CardContent>
                            </div>

                            <catalog.icon
                                strokeWidth={1.5}
                                className="absolute -right-6 -bottom-6 size-32 text-chart-1 -rotate-6 group-hover:rotate-6 group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-in-out"
                            />
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
