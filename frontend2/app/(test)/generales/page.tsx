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
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "Estados",
        description: "Gestión de estados y provincias por país",
        icon: Map,
        href: "/admin/config/general/states",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        title: "Géneros",
        description: "Catálogo de géneros e identidades",
        icon: Users,
        href: "/admin/config/general/genders",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        title: "Estado Civil",
        description: "Tipos de estado civil",
        icon: HeartHandshake,
        href: "/admin/config/general/marital-statuses",
        color: "text-pink-500",
        bg: "bg-pink-500/10"
    },
    {
        title: "Tipos de Dirección",
        description: "Clasificación de direcciones (Casa, Trabajo, etc.)",
        icon: MapPin,
        href: "/admin/config/general/address-types",
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    },
    {
        title: "Tipos de Teléfono",
        description: "Clasificación de teléfonos (Móvil, Fijo, etc.)",
        icon: Phone,
        href: "/admin/config/general/phone-types",
        color: "text-cyan-500",
        bg: "bg-cyan-500/10"
    },
    {
        title: "Operadoras",
        description: "Operadoras de telefonía móvil y fija",
        icon: Cpu,
        href: "/admin/config/general/phone-carriers",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
    {
        title: "Tipos de Email",
        description: "Clasificación de correos (Personal, Corporativo)",
        icon: Mail,
        href: "/admin/config/general/email-types",
        color: "text-red-500",
        bg: "bg-red-500/10"
    },
    {
        title: "Bancos",
        description: "Instituciones bancarias y financieras",
        icon: Landmark,
        href: "/admin/config/general/banks",
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        title: "Tipos de Cuenta",
        description: "Tipos de cuenta bancaria (Ahorro, Corriente)",
        icon: Wallet,
        href: "/admin/config/general/bank-account-types",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10"
    },
    {
        title: "Tipos de Relación",
        description: "Parentescos y tipos de relación familiar",
        icon: Share2,
        href: "/admin/config/general/relationship-types",
        color: "text-rose-500",
        bg: "bg-rose-500/10"
    },
    {
        title: "Códigos de Operadora",
        description: "Códigos de área por operadora telefónica",
        icon: Hash,
        href: "/admin/config/general/phone-carrier-codes",
        color: "text-blue-600",
        bg: "bg-blue-600/10"
    }
];

export default function GeneralConfigPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCatalogs = catalogs.filter(catalog =>
        catalog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.description.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer border-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {catalog.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${catalog.bg}`}>
                                    <catalog.icon className={`h-4 w-4 ${catalog.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="line-clamp-2">
                                    {catalog.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
