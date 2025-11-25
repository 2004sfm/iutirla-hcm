'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import apiClient from '@/lib/apiClient';
import { CatalogHeader, BreadcrumbItemType } from "@/components/CatalogHeader";
import { Button } from "@/components/ui/button";
import {
    Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Mail, Pencil, Phone, Loader2, MapPin,
    CreditCard, User, FileText, HeartHandshake, Star, Users
} from "lucide-react"; // Usamos Star de Lucide para mantener consistencia, pero con tu estilo amarillo
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
}

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Datos Personales", href: "/employee/personal-data" },
];

export default function PersonalDataPage() {
    const { user } = useAuth();
    const [person, setPerson] = useState<PersonData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const personId = typeof user?.person === 'object' ? user.person.id : user?.person;

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

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-chart-4" /></div>;
    if (!person) return <div className="p-8 text-center text-muted-foreground">No se encontró información asociada.</div>;

    return (
        <>
            <CatalogHeader items={breadcrumbItems} />

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-8 py-4">

                {/* 1. INFORMACIÓN PERSONAL */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Informacion Personal</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Primer nombre:</span>
                            <span className="text-sm">{person.first_name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Segundo nombre:</span>
                            <span className="text-sm">{val(person.second_name)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellido paterno:</span>
                            <span className="text-sm">{person.paternal_surname}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellido materno:</span>
                            <span className="text-sm">{val(person.maternal_surname)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Genero:</span>
                            <span className="text-sm">{val(person.gender_name)}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 2. INFORMACIÓN BIOGRÁFICA */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Información biográfica</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Fecha de nacimiento:</span>
                            <span className="text-sm">
                                {person.birthdate ? new Date(person.birthdate).toLocaleDateString() : val(null)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Pais de nacimiento:</span>
                            <span className="text-sm">{val(person.country_of_birth_name)}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 3. DIRECCIONES */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Direcciones</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        {person.addresses?.length > 0 ? (
                            person.addresses.map((addr: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 border-b last:border-0 pb-4 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Tipo de direccion:</span>
                                        <span className="text-sm">{val(addr.address_type_name)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Pais:</span>
                                        <span className="text-sm">{val(addr.country_name)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Estado:</span>
                                        <span className="text-sm">{val(addr.state_name)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Calle:</span>
                                        <span className="text-sm">{addr.street_name_and_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Ciudad:</span>
                                        <span className="text-sm">{val(addr.city)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground italic">No hay direcciones registradas.</span>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 4. CONTACTO (Con tu diseño de iconos y estrella) */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Información de Contacto</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="">
                        <div className="flex flex-col gap-4">
                            {/* Teléfonos */}
                            {person.phones?.map((phone: any, idx: number) => (
                                <div key={`ph-${idx}`} className="flex gap-4">
                                    <div className="relative size-12 flex items-center justify-center bg-chart-1 rounded-lg">
                                        <Phone className="size-5 text-chart-5" />
                                        {/* ESTRELLA SI ES PRIMARIO */}
                                        {phone.is_primary && (
                                            <div className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-background flex items-center justify-center border shadow-sm">
                                                <Star className="size-4 text-yellow-500 fill-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">{val(phone.phone_type_name)}</span>
                                        <span className="text-sm">{phone.area_code} {phone.subscriber_number}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Correos */}
                            {person.emails?.map((email: any, idx: number) => (
                                <div key={`em-${idx}`} className="flex gap-4">
                                    <div className="relative size-12 flex items-center justify-center bg-chart-1 rounded-lg">
                                        <Mail className="size-5 text-chart-5" />
                                        {email.is_primary && (
                                            <div className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-background flex items-center justify-center border shadow-sm">
                                                <Star className="size-4 text-yellow-500 fill-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">{val(email.email_type_name)}</span>
                                        <span className="text-sm">{email.email_address}</span>
                                    </div>
                                </div>
                            ))}

                            {(!person.phones?.length && !person.emails?.length) && <span className="text-sm italic text-muted-foreground">Sin datos de contacto.</span>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 5. DOCUMENTOS */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Documentos de Identidad</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {person.national_ids?.map((doc: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Tipo de Documento:</span>
                                    <span className="text-sm">{val(doc.document_type_name)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">No. de Documento:</span>
                                    <span className="text-sm">{doc.prefix}-{doc.number}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Principal:</span>
                                    <span className="text-sm">{doc.is_primary ? "Si" : "No"}</span>
                                </div>
                            </div>
                        ))}
                        {!person.national_ids?.length && <span className="text-sm italic text-muted-foreground">No registrado.</span>}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 6. CONTACTO EMERGENCIA */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Contacto de Emergencia</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {person.emergency_contacts?.map((ec: any, idx: number) => (
                            <div key={idx} className="contents">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Nombres:</span>
                                    <span className="text-sm">{ec.first_name} {ec.second_name}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Apellidos:</span>
                                    <span className="text-sm">{ec.paternal_surname} {ec.maternal_surname}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Telefono:</span>
                                    <span className="text-sm">{ec.phone_area_code} {ec.phone_number}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Relacion:</span>
                                    <span className="text-sm">{val(ec.relationship_name)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Principal:</span>
                                    <span className="text-sm">{ec.is_primary ? "Si" : "No"}</span>
                                </div>
                            </div>
                        ))}
                        {!person.emergency_contacts?.length && <span className="text-sm italic text-muted-foreground col-span-3">No registrado.</span>}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 7. DEPENDIENTES */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Dependientes</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {person.dependents?.map((dep: any, idx: number) => (
                            <div key={idx} className="contents">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Nombres:</span>
                                    <span className="text-sm">{dep.first_name}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Apellidos:</span>
                                    <span className="text-sm">{dep.paternal_surname}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Relacion:</span>
                                    <span className="text-sm">{val(dep.relationship_name)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Fecha de nacimiento:</span>
                                    <span className="text-sm">{dep.birthdate}</span>
                                </div>
                            </div>
                        ))}
                        {!person.dependents?.length && <span className="text-sm italic text-muted-foreground col-span-3">No registrados.</span>}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                {/* 8. INFORMACIÓN DE PAGO (Con tu diseño exacto de GRID y Estrella) */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">Información de pago</CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        {person.bank_accounts?.length > 0 ? (
                            person.bank_accounts.map((bank: any, idx: number) => (
                                <div key={idx} className="flex gap-4 items-start">

                                    {/* 1. ÍCONO: Fijo a la izquierda */}
                                    <div className="relative size-12 shrink-0 flex items-center justify-center bg-chart-1 rounded-lg">
                                        <CreditCard className="size-5 text-chart-5" />
                                        {/* Estrella si es primario */}
                                        {bank.is_primary && (
                                            <div className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-background flex items-center justify-center border shadow-sm">
                                                <Star className="size-4 text-yellow-500 fill-yellow-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. TEXTOS: Grid Responsivo exacto */}
                                    <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {/* Banco */}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm text-muted-foreground">Banco:</span>
                                            <span className="text-sm font-medium">{val(bank.bank_name)}</span>
                                        </div>
                                        {/* Código (Si tu API lo manda, o el tipo de cuenta) */}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm text-muted-foreground">Tipo:</span>
                                            <span className="text-sm font-medium">{val(bank.account_type_name)}</span>
                                        </div>
                                        {/* Cuenta */}
                                        <div className="flex flex-col justify-center col-span-2 md:col-span-1">
                                            <span className="text-sm text-muted-foreground">Numero de cuenta:</span>
                                            <span className="text-sm font-medium">{bank.account_number}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No hay cuentas bancarias registradas.</span>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

            </div>
        </>
    );
}