"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import apiClient from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Mail, Pencil, Phone, Loader2, MapPin,
    CreditCard, User, FileText, HeartHandshake, Star, Users
} from "lucide-react";
import Link from "next/link";

// Tipos de datos
interface PersonData {
    id: number;
    first_name: string;
    second_name: string | null;
    paternal_surname: string;
    maternal_surname: string | null;
    gender_name?: string;
    birthdate: string | null;
    country_of_birth_name?: string;
    addresses: any[];
    phones: any[];
    emails: any[];
    national_ids: any[];
    emergency_contacts: any[];
    bank_accounts: any[];
    dependents: any[];
    photo?: string;
}

export default function PersonalDataPage() {
    const { user } = useAuth();
    const [person, setPerson] = useState<PersonData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // In frontend2 auth-context, 'user' structure might be different. 
            // Assuming user.person is the object or ID.
            // Based on training/page.tsx: user?.person?.id
            const personId = user?.person?.id;

            if (personId) {
                try {
                    setLoading(true);
                    const { data } = await apiClient.get(`/api/core/persons/${personId}/`);
                    setPerson(data);
                } catch (error) {
                    console.error("Error cargando datos", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const val = (text: any) => text || <span className="text-muted-foreground italic text-xs">No registrado</span>;

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (!person) return <div className="p-8 text-center text-muted-foreground">No se encontró información asociada.</div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Datos Personales</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tu información personal y de contacto
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pb-8">

                {/* 1. INFORMACIÓN PERSONAL */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Información Personal</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Primer nombre:</span>
                            <span className="text-sm font-medium">{person.first_name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Segundo nombre:</span>
                            <span className="text-sm font-medium">{val(person.second_name)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellido paterno:</span>
                            <span className="text-sm font-medium">{person.paternal_surname}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellido materno:</span>
                            <span className="text-sm font-medium">{val(person.maternal_surname)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Género:</span>
                            <span className="text-sm font-medium">{val(person.gender_name)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. INFORMACIÓN BIOGRÁFICA */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Información Biográfica</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Fecha de nacimiento:</span>
                            <span className="text-sm font-medium">
                                {person.birthdate ? new Date(person.birthdate).toLocaleDateString() : val(null)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">País de nacimiento:</span>
                            <span className="text-sm font-medium">{val(person.country_of_birth_name)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. DIRECCIONES */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Direcciones</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.addresses?.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.addresses.map((addr: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Tipo de dirección:</span>
                                            <span className="text-sm font-medium">{val(addr.address_type_name)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">País:</span>
                                            <span className="text-sm font-medium">{val(addr.country_name)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Estado:</span>
                                            <span className="text-sm font-medium">{val(addr.state_name)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Calle:</span>
                                            <span className="text-sm font-medium">{addr.street_name_and_number}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Ciudad:</span>
                                            <span className="text-sm font-medium">{val(addr.city)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No hay direcciones registradas.</span>
                        )}
                    </CardContent>
                </Card>

                {/* 4. CONTACTO */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Información de Contacto</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-col gap-4">
                            {/* Teléfonos */}
                            {person.phones?.map((phone: any, idx: number) => (
                                <div key={`ph-${idx}`} className="flex gap-4">
                                    <div className="relative size-10 flex items-center justify-center bg-primary/10 rounded-lg">
                                        <Phone className="size-5 text-primary" />
                                        {phone.is_primary && (
                                            <div className="absolute -right-1.5 -bottom-1.5 size-4 rounded-full bg-background flex items-center justify-center border shadow-sm">
                                                <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">{val(phone.phone_type_name)}</span>
                                        <span className="text-sm font-medium">{phone.full_number}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Correos */}
                            {person.emails?.map((email: any, idx: number) => (
                                <div key={`em-${idx}`} className="flex gap-4">
                                    <div className="relative size-10 flex items-center justify-center bg-primary/10 rounded-lg">
                                        <Mail className="size-5 text-primary" />
                                        {email.is_primary && (
                                            <div className="absolute -right-1.5 -bottom-1.5 size-4 rounded-full bg-background flex items-center justify-center border shadow-sm">
                                                <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">{val(email.email_type_name)}</span>
                                        <span className="text-sm font-medium">{email.email_address}</span>
                                    </div>
                                </div>
                            ))}

                            {(!person.phones?.length && !person.emails?.length) && <span className="text-sm italic text-muted-foreground">Sin datos de contacto.</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* 5. DOCUMENTOS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Documentos de Identidad</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-col gap-4">
                            {person.national_ids?.map((doc: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 border-b last:border-0 pb-4 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Tipo de Documento:</span>
                                        <span className="text-sm font-medium">{val(doc.document_type_name)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">No. de Documento:</span>
                                        <span className="text-sm font-medium">{doc.prefix}-{doc.number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Principal:</span>
                                        <span className="text-sm font-medium">{doc.is_primary ? "Si" : "No"}</span>
                                    </div>
                                </div>
                            ))}
                            {!person.national_ids?.length && <span className="text-sm italic text-muted-foreground">No registrado.</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* 6. CONTACTO EMERGENCIA */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Contacto de Emergencia</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.emergency_contacts?.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.emergency_contacts.map((ec: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Nombre Completo:</span>
                                                <span className="text-sm font-medium hover:text-primary transition-colors cursor-default">{ec.first_name} {ec.paternal_surname}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Relación:</span>
                                                <span className="text-sm font-medium">{val(ec.relationship_name)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Principal:</span>
                                                <span className="text-sm font-medium">{ec.is_primary ? "Si" : "No"}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Teléfono:</span>
                                            <span className="text-sm font-medium">
                                                {ec.phone_country_code} {ec.phone_carrier_code} {ec.phone_number}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No registrado.</span>
                        )}
                    </CardContent>
                </Card>

                {/* 7. DEPENDIENTES */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Dependientes</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.dependents?.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.dependents.map((dep: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Nombre Completo:</span>
                                                <span className="text-sm font-medium">{dep.first_name} {dep.paternal_surname}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Relación:</span>
                                                <span className="text-sm font-medium">{val(dep.relationship_name)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Género:</span>
                                                <span className="text-sm font-medium">{val(dep.gender_name)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Fecha de nacimiento:</span>
                                            <span className="text-sm font-medium">
                                                {dep.birthdate ? new Date(dep.birthdate).toLocaleDateString() : val(null)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No registrados.</span>
                        )}
                    </CardContent>
                </Card>

                {/* 8. INFORMACIÓN DE PAGO */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Información de Pago</CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.bank_accounts?.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.bank_accounts.map((bank: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        {/* 1. ÍCONO */}
                                        <div className="relative size-10 shrink-0 flex items-center justify-center bg-primary/10 rounded-lg">
                                            <CreditCard className="size-5 text-primary" />
                                            {bank.is_primary && (
                                                <div className="absolute -right-1.5 -bottom-1.5 size-4 rounded-full bg-background flex items-center justify-center border shadow-sm">
                                                    <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. TEXTOS */}
                                        <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="flex flex-col justify-center">
                                                <span className="text-sm text-muted-foreground">Banco:</span>
                                                <span className="text-sm font-medium">{val(bank.bank_name)}</span>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-sm text-muted-foreground">Tipo:</span>
                                                <span className="text-sm font-medium">{val(bank.bank_account_type_name)}</span>
                                            </div>
                                            <div className="flex flex-col justify-center col-span-2 md:col-span-1">
                                                <span className="text-sm text-muted-foreground">Número de cuenta:</span>
                                                <span className="text-sm font-medium">{bank.account_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No hay cuentas bancarias registradas.</span>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
