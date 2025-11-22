import { AdminHeader, BreadcrumbItemType } from "@/components/AdminHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { StarIcon } from '@heroicons/react/24/solid';
import { CreditCardIcon } from '@heroicons/react/24/outline';

const breadcrumbItems: BreadcrumbItemType[] = [
    { name: "Perfil Profesional", href: "/employee" },
    { name: "Datos Personales", href: "/employee/personal-data" },
];

export default function PersonalDataPage() {
    return (
        <>
            <AdminHeader
                items={breadcrumbItems}
            />
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-8 py-4">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Informacion Personal
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Primer nombre:</span>
                            <span className="text-sm">Santiago</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Segundo nombre:</span>
                            <span className="text-sm">Jesus</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellido paterno:</span>
                            <span className="text-sm">Fermin</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellido materno:</span>
                            <span className="text-sm">Mariña</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Genero:</span>
                            <span className="text-sm">Masculino</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Información biográfica
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Fecha de nacimiento:</span>
                            <span className="text-sm">16/09/2004</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Pais de nacimiento:</span>
                            <span className="text-sm">Venezuela</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Direcciones
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Tipo de direccion:</span>
                            <span className="text-sm">Hogar</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Pais:</span>
                            <span className="text-sm">Venezuela</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Estado:</span>
                            <span className="text-sm">Nueva Esparta</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Calle:</span>
                            <span className="text-sm">Calle Libertad</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Ciudad:</span>
                            <span className="text-sm">San Juan Bautista</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Direcciones
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="">

                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="relative size-12 flex items-center justify-center bg-chart-1 rounded-lg">
                                    <Phone className="size-5 text-chart-5" />
                                    <div className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-background flex items-center justify-center">
                                        <StarIcon className="size-4 text-yellow-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Personal</span>
                                    <span className="text-sm">+58 424-8167536</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="relative size-12 flex items-center justify-center bg-chart-1 rounded-lg">
                                    <Mail className="size-5 text-chart-5" />
                                    <div className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-background flex items-center justify-center">
                                        <StarIcon className="size-4 text-yellow-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Personal</span>
                                    <span className="text-sm">2004sfm@gmail.com</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Documentos de Identidad
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Pais:</span>
                                <span className="text-sm">Venezuela</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">No. de Documento:</span>
                                <span className="text-sm">30539731</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Tipo de Documento:</span>
                                <span className="text-sm">Cedula</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Pais:</span>
                                <span className="text-sm">Venezuela</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">No. de Documento:</span>
                                <span className="text-sm">V-12345678-9</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Tipo de Documento:</span>
                                <span className="text-sm">RIF</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Contacto de Emergencia
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Nombres:</span>
                            <span className="text-sm">Santiago Jesus</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellidos:</span>
                            <span className="text-sm">Fermin Mariña</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Telefono:</span>
                            <span className="text-sm">+58 424-816-7536</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Relacion:</span>
                            <span className="text-sm">Padre</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Principal:</span>
                            <span className="text-sm">Si</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Dependientes
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Nombres:</span>
                            <span className="text-sm">Santiago Jesus</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Apellidos:</span>
                            <span className="text-sm">Fermin Mariña</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Telefono:</span>
                            <span className="text-sm">+58 424-816-7536</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Relacion:</span>
                            <span className="text-sm">Hijo</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Fecha de nacimiento:</span>
                            <span className="text-sm">16/09/2004</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="">
                            Información de pago
                        </CardTitle>
                        <CardAction>
                            <Button variant={"ghost"} size={"icon"} className="rounded-full">
                                <Pencil className="size-4 text-chart-4" />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">

                        {/* CONTENEDOR PRINCIPAL: Usamos Flex para separar ÍCONO (Izq) de TEXTOS (Der) */}
                        <div className="flex gap-4 items-start">

                            {/* 1. EL ÍCONO: Se queda fijo a la izquierda (shrink-0) */}
                            <div className="relative size-12 shrink-0 flex items-center justify-center bg-chart-1 rounded-lg">
                                <CreditCardIcon className="size-5 text-chart-5" />
                                <div className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-background flex items-center justify-center">
                                    <StarIcon className="size-4 text-yellow-500" />
                                </div>
                            </div>

                            {/* 2. LOS TEXTOS: Aquí recuperamos tu GRID responsivo */}
                            {/* - Móvil: grid-cols-1 (Uno debajo del otro, alineados a la derecha del ícono) */}
                            {/* - MD: grid-cols-2 (2 columnas de texto) */}
                            {/* - LG: grid-cols-3 (3 columnas de texto) */}
                            <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                                {/* Item 1: Banco */}
                                <div className="flex flex-col justify-center">
                                    <span className="text-sm text-muted-foreground">Banco:</span>
                                    <span className="text-sm font-medium">Banco de Venezuela</span>
                                </div>

                                {/* Item 2: Código */}
                                <div className="flex flex-col justify-center">
                                    <span className="text-sm text-muted-foreground">Codigo:</span>
                                    <span className="text-sm font-medium">0102</span>
                                </div>

                                {/* Item 3: Cuenta */}
                                <div className="flex flex-col justify-center col-span-2 md:col-span-1">
                                    <span className="text-sm text-muted-foreground">Numero de cuenta:</span>
                                    <span className="text-sm font-medium">1020 0120 0120 0123</span>
                                </div>

                            </div>
                        </div>

                        {/* --- SEGUNDO BLOQUE (Ejemplo repetido) --- */}
                        <div className="flex gap-4 items-start">
                            <div className="size-12 shrink-0 flex items-center justify-center bg-chart-1 rounded-lg">
                                <CreditCardIcon className="size-5 text-chart-5" />
                            </div>
                            {/* Mismo Grid aquí */}
                            <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="flex flex-col justify-center">
                                    <span className="text-sm text-muted-foreground">Banco:</span>
                                    <span className="text-sm font-medium">Banco de Venezuela</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-sm text-muted-foreground">Codigo:</span>
                                    <span className="text-sm font-medium">0102</span>
                                </div>
                                <div className="flex flex-col justify-center col-span-2 md:col-span-1">
                                    <span className="text-sm text-muted-foreground">Numero de cuenta:</span>
                                    <span className="text-sm font-medium">1020 0120 0120 0123</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm text-chart-4">
                        <Link href={"#"}>Ver todo</Link>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}