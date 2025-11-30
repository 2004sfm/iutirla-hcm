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
        gradient: "from-blue-900 via-blue-700 to-blue-500",
        iconColor: "text-blue-200/90"
    },
    {
        title: "Estados",
        description: "Gestión de estados y provincias por país",
        icon: Map,
        href: "/admin/config/general/states",
        gradient: "from-emerald-900 via-emerald-700 to-emerald-500",
        iconColor: "text-emerald-200/90"
    },
    {
        title: "Géneros",
        description: "Catálogo de géneros e identidades",
        icon: Users,
        href: "/admin/config/general/genders",
        gradient: "from-purple-900 via-purple-700 to-purple-500",
        iconColor: "text-purple-200/90"
    },
    {
        title: "Estado Civil",
        description: "Tipos de estado civil",
        icon: HeartHandshake,
        href: "/admin/config/general/marital-statuses",
        gradient: "from-pink-900 via-pink-700 to-pink-500",
        iconColor: "text-pink-200/90"
    },
    {
        title: "Tipos de Dirección",
        description: "Clasificación de direcciones (Casa, Trabajo, etc.)",
        icon: MapPin,
        href: "/admin/config/general/address-types",
        gradient: "from-orange-900 via-orange-700 to-orange-500",
        iconColor: "text-orange-200/90"
    },
    {
        title: "Tipos de Teléfono",
        description: "Clasificación de teléfonos (Móvil, Fijo, etc.)",
        icon: Phone,
        href: "/admin/config/general/phone-types",
        gradient: "from-cyan-900 via-cyan-700 to-cyan-500",
        iconColor: "text-cyan-200/90"
    },
    {
        title: "Operadoras",
        description: "Operadoras de telefonía móvil y fija",
        icon: Cpu,
        href: "/admin/config/general/phone-carriers",
        gradient: "from-indigo-900 via-indigo-700 to-indigo-500",
        iconColor: "text-indigo-200/90"
    },
    {
        title: "Tipos de Email",
        description: "Clasificación de correos (Personal, Corporativo)",
        icon: Mail,
        href: "/admin/config/general/email-types",
        gradient: "from-red-900 via-red-700 to-red-500",
        iconColor: "text-red-200/90"
    },
    {
        title: "Bancos",
        description: "Instituciones bancarias y financieras",
        icon: Landmark,
        href: "/admin/config/general/banks",
        gradient: "from-green-900 via-green-700 to-green-500",
        iconColor: "text-green-200/90"
    },
    {
        title: "Tipos de Cuenta",
        description: "Tipos de cuenta bancaria (Ahorro, Corriente)",
        icon: Wallet,
        href: "/admin/config/general/bank-account-types",
        gradient: "from-yellow-900 via-yellow-700 to-yellow-500",
        iconColor: "text-yellow-200/90"
    },
    {
        title: "Tipos de Relación",
        description: "Parentescos y tipos de relación familiar",
        icon: Share2,
        href: "/admin/config/general/relationship-types",
        gradient: "from-rose-900 via-rose-700 to-rose-500",
        iconColor: "text-rose-200/90"
    },
    {
        title: "Códigos de Operadora",
        description: "Códigos de área por operadora telefónica",
        icon: Hash,
        href: "/admin/config/general/phone-carrier-codes",
        gradient: "from-blue-950 via-blue-800 to-blue-600",
        iconColor: "text-blue-200/90"
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
                        <Card className={`relative h-[140px] flex flex-col p-5 overflow-hidden bg-linear-to-br ${catalog.gradient} hover:scale-105 hover:contrast-125 hover:shadow-xl transition-all duration-300 ease-out group cursor-pointer text-white border-0`}>
                            <div className="h-full relative z-10 flex flex-col justify-between gap-1">
                                <CardHeader className="p-0 space-y-0">
                                    <CardTitle className="mr-20 text-xl font-bold leading-tight">
                                        {catalog.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <CardDescription className="mr-26 text-white/90 text-sm font-medium line-clamp-2">
                                        {catalog.description}
                                    </CardDescription>
                                </CardContent>
                            </div>

                            <catalog.icon
                                strokeWidth={1.5}
                                className={`absolute -right-6 -bottom-6 size-32 ${catalog.iconColor} -rotate-6 group-hover:rotate-6 group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-in-out`}
                            />
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
