"use client";

import { useState, use, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, User, Contact, FileText, Users, Mail, Phone, MapPin, CreditCard, Globe, Pencil, GraduationCap, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonForm } from "@/components/personnel/PersonForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogCRUD, CatalogField } from "@/components/catalogs/catalog-crud";
import { ColumnDef } from "@tanstack/react-table";
import apiClient from "@/lib/api-client";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const { setLabel } = useBreadcrumb();
    const { mutate } = useSWRConfig();
    const [isEditing, setIsEditing] = useState(false);
    const { data: person, error, isLoading } = useSWR(`/api/core/persons/${id}/`, fetcher);
    const { data: countries } = useSWR("/api/core/countries/", fetcher);
    const countriesList = countries?.results || (Array.isArray(countries) ? countries : []);
    const venezuelaId = countriesList.find((c: any) => c.iso_2 === "VE")?.id;

    useEffect(() => {
        if (person) {
            const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            setLabel(normalizedPath, person.full_name);
        }
    }, [person, pathname, setLabel]);

    if (isLoading) return <PersonDetailSkeleton />;
    if (error || !person) return <PersonError router={router} />;

    // --- CONFIGURACIÓN DE CATÁLOGOS ANIDADOS ---

    // 1. Emails
    const emailFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "email_type", label: "Tipo", type: "select", required: true, optionsUrl: "/api/core/email-types/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "email_address", label: "Email", type: "email", required: true },
        { name: "is_primary", label: "Principal", type: "checkbox" },
    ];
    const emailColumns: ColumnDef<any>[] = [
        { accessorKey: "email_type_name", header: "Tipo", cell: ({ row }) => row.getValue("email_type_name") },
        { accessorKey: "email_address", header: "Email", cell: ({ row }) => row.getValue("email_address") },
        {
            accessorKey: "is_primary",
            header: "Principal",
            cell: ({ row }) => row.original.is_primary ? (
                <Badge className="bg-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/90 text-white gap-1">
                    <Star className="size-3 fill-current" /> Principal
                </Badge>
            ) : (
                <Badge variant="secondary">Secundario</Badge>
            )
        },
    ];

    // 2. Teléfonos
    const phoneFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "phone_type", label: "Tipo", type: "select", required: true, optionsUrl: "/api/core/phone-types/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "carrier_code", label: "Operadora", type: "select", required: true, optionsUrl: "/api/core/phone-carrier-codes/", optionLabelKey: "code", optionValueKey: "id" },
        { name: "subscriber_number", label: "Número", type: "number", required: true },
        { name: "is_primary", label: "Principal", type: "checkbox" },
    ];
    const phoneColumns: ColumnDef<any>[] = [
        { accessorKey: "phone_type_name", header: "Tipo", cell: ({ row }) => row.getValue("phone_type_name") },
        { accessorKey: "full_number", header: "Número", cell: ({ row }) => row.original.full_number },
        {
            accessorKey: "is_primary",
            header: "Principal",
            cell: ({ row }) => row.original.is_primary ? (
                <Badge className="bg-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/90 text-white gap-1">
                    <Star className="size-3 fill-current" /> Principal
                </Badge>
            ) : (
                <Badge variant="secondary">Secundario</Badge>
            )
        },
    ];



    // 3. Direcciones
    const addressFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "address_type", label: "Tipo", type: "select", required: true, optionsUrl: "/api/core/address-types/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "country", label: "País", type: "hidden", defaultValue: venezuelaId },
        { name: "state", label: "Estado", type: "select", required: true, optionsUrl: "/api/core/states/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "city", label: "Ciudad", type: "text", required: true },
        { name: "street_name_and_number", label: "Calle/Avenida", type: "text", required: true },
    ];
    const addressColumns: ColumnDef<any>[] = [
        { accessorKey: "address_type_name", header: "Tipo", cell: ({ row }) => row.getValue("address_type_name") },
        { accessorKey: "state_name", header: "Estado", cell: ({ row }) => row.getValue("state_name") },
        { accessorKey: "city", header: "Ciudad", cell: ({ row }) => row.getValue("city") },
        { accessorKey: "street_name_and_number", header: "Calle/Avenida", cell: ({ row }) => row.getValue("street_name_and_number") },
    ];

    // 4. Documentos de Identidad
    const docFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        {
            name: "category",
            label: "Categoría",
            type: "select",
            required: true,
            options: [
                { label: "Cédula", value: "CEDULA" },
                { label: "RIF", value: "RIF" },
                { label: "Pasaporte", value: "PASSPORT" }
            ]
        },
        {
            name: "document_type",
            label: "Prefijo",
            type: "select",
            required: true,
            options: [
                { label: "V - Venezolano", value: "V" },
                { label: "E - Extranjero", value: "E" },
                { label: "J - Jurídico", value: "J" },
                { label: "G - Gubernamental", value: "G" },
                { label: "P - Pasaporte", value: "P" }
            ]
        },
        { name: "number", label: "Número", type: "text", required: true },
        { name: "is_primary", label: "Principal", type: "checkbox" },
    ];
    const nationalIdColumns: ColumnDef<any>[] = [
        { accessorKey: "category_display", header: "Categoría", cell: ({ row }) => row.getValue("category_display") },
        { accessorKey: "full_document", header: "Documento", cell: ({ row }) => row.original.full_document },
        {
            accessorKey: "is_primary",
            header: "Principal",
            cell: ({ row }) => row.original.is_primary ? (
                <Badge className="bg-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/90 text-white gap-1">
                    <Star className="size-3 fill-current" /> Principal
                </Badge>
            ) : (
                <Badge variant="secondary">Secundario</Badge>
            )
        },
    ];

    // 4b. Cuentas Bancarias
    const bankFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        {
            name: "bank",
            label: "Banco",
            type: "select",
            required: true,
            optionsUrl: "/api/core/banks/",
            optionLabelKey: "display_name",
            optionValueKey: "id",
            onChange: (value, form, options) => {
                const selectedBank = options?.find((opt: any) => opt.id.toString() === value);
                if (selectedBank) {
                    form.setValue("account_number", selectedBank.code);
                }
            }
        },
        { name: "bank_account_type", label: "Tipo de Cuenta", type: "select", required: true, optionsUrl: "/api/core/bank-account-types/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "account_number", label: "Número de Cuenta", type: "text", required: true },
        { name: "is_primary", label: "Principal", type: "checkbox" },
    ];
    const bankColumns: ColumnDef<any>[] = [
        { accessorKey: "bank_name", header: "Banco", cell: ({ row }) => row.getValue("bank_name") },
        { accessorKey: "bank_account_type_name", header: "Tipo", cell: ({ row }) => row.getValue("bank_account_type_name") },
        { accessorKey: "account_number", header: "Número", cell: ({ row }) => row.getValue("account_number") },
        {
            accessorKey: "is_primary",
            header: "Principal",
            cell: ({ row }) => row.original.is_primary ? (
                <Badge className="bg-[var(--brand-tertiary)] hover:bg-[var(--brand-tertiary)]/90 text-white gap-1">
                    <Star className="size-3 fill-current" /> Principal
                </Badge>
            ) : (
                <Badge variant="secondary">Secundario</Badge>
            )
        },
    ];

    // 5. Dependientes
    const dependentFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "first_name", label: "Primer Nombre", type: "text", required: true },
        { name: "paternal_surname", label: "Apellido Paterno", type: "text", required: true },
        { name: "relationship", label: "Parentesco", type: "select", required: true, optionsUrl: "/api/core/relationship-types/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "birthdate", label: "Fecha de Nacimiento", type: "date", required: true },
        { name: "gender", label: "Género", type: "select", required: false, optionsUrl: "/api/core/genders/", optionLabelKey: "name", optionValueKey: "id" },
    ];
    const dependentColumns: ColumnDef<any>[] = [
        { accessorKey: "first_name", header: "Nombre", cell: ({ row }) => `${row.original.first_name} ${row.original.paternal_surname}` },
        { accessorKey: "relationship_name", header: "Parentesco", cell: ({ row }) => row.getValue("relationship_name") },
        { accessorKey: "birthdate", header: "Fecha Nacimiento", cell: ({ row }) => row.getValue("birthdate") },
    ];

    // 6. Contactos de Emergencia
    const emergencyFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "first_name", label: "Primer Nombre", type: "text", required: true },
        { name: "paternal_surname", label: "Apellido Paterno", type: "text", required: true },
        { name: "relationship", label: "Parentesco", type: "select", required: true, optionsUrl: "/api/core/relationship-types/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "phone_carrier_code", label: "Operadora", type: "select", required: true, optionsUrl: "/api/core/phone-carrier-codes/", optionLabelKey: "code", optionValueKey: "id" },
        { name: "phone_number", label: "Teléfono", type: "text", required: true },
        { name: "is_primary", label: "Principal", type: "checkbox" },
    ];
    const emergencyColumns: ColumnDef<any>[] = [
        { accessorKey: "first_name", header: "Nombre", cell: ({ row }) => `${row.original.first_name} ${row.original.paternal_surname}` },
        { accessorKey: "relationship_name", header: "Parentesco", cell: ({ row }) => row.getValue("relationship_name") },
        { accessorKey: "phone_number", header: "Teléfono", cell: ({ row }) => row.original.phone_number }, // Adjust if carrier code needed
    ];

    // 7. Formación Académica (Education)
    const educationFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "level", label: "Nivel", type: "select", required: true, optionsUrl: "/api/talent/education-levels/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "field_of_study", label: "Campo de Estudio", type: "select", required: true, optionsUrl: "/api/talent/fields-of-study/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "school_name", label: "Institución", type: "text", required: true },
        { name: "start_date", label: "Fecha Inicio", type: "date", required: true },
        { name: "end_date", label: "Fecha Fin", type: "date" },
        { name: "is_current", label: "Cursando Actualmente", type: "checkbox" },
    ];
    const educationColumns: ColumnDef<any>[] = [
        { accessorKey: "level_name", header: "Nivel", cell: ({ row }) => row.getValue("level_name") },
        { accessorKey: "field_of_study_name", header: "Campo", cell: ({ row }) => row.getValue("field_of_study_name") },
        { accessorKey: "school_name", header: "Institución", cell: ({ row }) => row.getValue("school_name") },
        { accessorKey: "start_date", header: "Inicio", cell: ({ row }) => row.getValue("start_date") },
    ];

    // 8. Certificaciones
    const certificationFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "name", label: "Nombre", type: "text", required: true },
        { name: "institution", label: "Institución", type: "text", required: true },
        { name: "effective_date", label: "Fecha Emisión", type: "date", required: true },
        { name: "expiration_date", label: "Fecha Expiración", type: "date" },
        { name: "credential_id", label: "ID Credencial", type: "text" },
        { name: "url", label: "URL", type: "text" },
    ];
    const certificationColumns: ColumnDef<any>[] = [
        { accessorKey: "name", header: "Nombre", cell: ({ row }) => row.getValue("name") },
        { accessorKey: "institution", header: "Institución", cell: ({ row }) => row.getValue("institution") },
        { accessorKey: "effective_date", header: "Emisión", cell: ({ row }) => row.getValue("effective_date") },
    ];

    // 9. Idiomas
    const languageFields: CatalogField[] = [
        { name: "person", label: "Persona", type: "hidden", defaultValue: id },
        { name: "language", label: "Idioma", type: "select", required: true, optionsUrl: "/api/talent/languages/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "speaking_proficiency", label: "Habla", type: "select", required: true, optionsUrl: "/api/talent/language-proficiencies/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "reading_proficiency", label: "Lectura", type: "select", required: true, optionsUrl: "/api/talent/language-proficiencies/", optionLabelKey: "name", optionValueKey: "id" },
        { name: "writing_proficiency", label: "Escritura", type: "select", required: true, optionsUrl: "/api/talent/language-proficiencies/", optionLabelKey: "name", optionValueKey: "id" },
    ];
    const languageColumns: ColumnDef<any>[] = [
        { accessorKey: "language_name", header: "Idioma", cell: ({ row }) => row.getValue("language_name") },
        { accessorKey: "speaking_proficiency_name", header: "Habla", cell: ({ row }) => row.getValue("speaking_proficiency_name") },
        { accessorKey: "reading_proficiency_name", header: "Lectura", cell: ({ row }) => row.getValue("reading_proficiency_name") },
        { accessorKey: "writing_proficiency_name", header: "Escritura", cell: ({ row }) => row.getValue("writing_proficiency_name") },
    ];


    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                        <AvatarImage src={person.photo} alt={person.full_name} />
                        <AvatarFallback className="text-xl"><User /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center sm:items-start">
                        <h1 className="text-2xl font-bold tracking-tight">{person.full_name}</h1>
                        <div className="flex items-center text-muted-foreground mt-1 gap-4 text-sm">
                            <span className="flex items-center"><FileText className="h-3 w-3 mr-2" /> {person.primary_document || "Sin documento"}</span>
                            <span className="flex items-center"><Mail className="h-3 w-3 mr-2" /> {person.primary_email || "Sin email"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 justify-center">
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="size-4" />
                            Editar
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => isEditing ? setIsEditing(false) : router.back()}>
                        <ArrowLeft className="size-4" />
                    </Button>
                </div>
            </div>

            {isEditing ? (
                <PersonForm
                    initialData={person}
                    isEditing={true}
                    personId={id}
                    onSuccess={() => {
                        setIsEditing(false);
                        mutate(`/api/core/persons/${id}/`);
                    }}
                />
            ) : (
                <Tabs defaultValue="general" className="flex-1 flex flex-col">
                    <TabsList className="w-full flex flex-col min-[24rem]:grid min-[24rem]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/50 gap-1">
                        <TabsTrigger
                            value="general"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                        >
                            <User className="mr-1 size-4" />
                            <p className="truncate">General</p>
                        </TabsTrigger>
                        <TabsTrigger
                            value="credentials"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                        >
                            <CreditCard className="mr-1 size-4" />
                            <p className="truncate">Credenciales</p>
                        </TabsTrigger>
                        <TabsTrigger
                            value="contact"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                        >
                            <Phone className="mr-1 size-4" />
                            <p className="truncate">Contacto</p>
                        </TabsTrigger>
                        <TabsTrigger
                            value="location"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                        >
                            <MapPin className="mr-1 size-4" />
                            <p className="truncate">Ubicación</p>
                        </TabsTrigger>
                        <TabsTrigger
                            value="links"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                        >
                            <LinkIcon className="mr-1 size-4" />
                            <p className="truncate">Vínculos</p>
                        </TabsTrigger>
                        <TabsTrigger
                            value="talent"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 transition-all duration-300 w-full"
                        >
                            <GraduationCap className="mr-1 size-4" />
                            <p className="truncate">Talento</p>
                        </TabsTrigger>
                    </TabsList >

                    <div className="flex-1 mt-6">
                        {/* --- 1. GENERAL INFO --- */}
                        <TabsContent value="general" className="m-0 space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    <InfoRow label="Primer Nombre" value={person.first_name} />
                                    <InfoRow label="Segundo Nombre" value={person.second_name} />
                                    <InfoRow label="Apellido Paterno" value={person.paternal_surname} />
                                    <InfoRow label="Apellido Materno" value={person.maternal_surname} />
                                    <InfoRow label="Fecha de Nacimiento" value={person.birthdate} />
                                    <InfoRow label="País de Nacimiento" value={person.country_of_birth_name} />
                                    <InfoRow label="Género" value={person.gender_name} />
                                    <InfoRow label="Estado Civil" value={person.marital_status_name} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- 2. CREDENCIALES (Identidad + Bancos) --- */}
                        <TabsContent value="credentials" className="m-0 space-y-8">
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Documentos de Identidad"
                                    icon={FileText}
                                    apiUrl={`/api/core/national-ids/?person=${id}`}
                                    fields={docFields}
                                    columns={nationalIdColumns}
                                    disablePagination={true}
                                />
                            </div>
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Cuentas Bancarias"
                                    icon={CreditCard}
                                    apiUrl={`/api/core/person-bank-accounts/?person=${id}`}
                                    fields={bankFields}
                                    columns={bankColumns}
                                    searchKey="account_number"
                                    disablePagination={true}
                                />
                            </div>
                        </TabsContent>

                        {/* --- 3. CONTACTO --- */}
                        <TabsContent value="contact" className="m-0 space-y-8">
                            <div className="grid gap-8 grid-cols-1">
                                <div className="space-y-4">
                                    <CatalogCRUD
                                        title="Correos Electrónicos"
                                        icon={Mail}
                                        apiUrl={`/api/core/person-emails/?person=${id}`}
                                        fields={emailFields}
                                        columns={emailColumns}
                                        searchKey="email_address"
                                        disablePagination={true}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <CatalogCRUD
                                        title="Teléfonos"
                                        icon={Phone}
                                        apiUrl={`/api/core/person-phones/?person=${id}`}
                                        fields={phoneFields}
                                        columns={phoneColumns}
                                        searchKey="subscriber_number"
                                        disablePagination={true}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- 4. UBICACIÓN --- */}
                        <TabsContent value="location" className="m-0 space-y-8">
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Direcciones"
                                    icon={MapPin}
                                    apiUrl={`/api/core/addresses/?person=${id}`}
                                    fields={addressFields}
                                    columns={addressColumns}
                                    searchKey="city"
                                    disablePagination={true}
                                />
                            </div>
                        </TabsContent>

                        {/* --- 5. VÍNCULOS --- */}
                        <TabsContent value="links" className="m-0 space-y-8">
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Dependientes"
                                    icon={Users}
                                    apiUrl={`/api/core/dependents/?person=${id}`}
                                    fields={dependentFields}
                                    columns={dependentColumns}
                                    searchKey="first_name"
                                    disablePagination={true}
                                />
                            </div>
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Contactos de Emergencia"
                                    icon={Users}
                                    apiUrl={`/api/core/emergency-contacts/?person=${id}`}
                                    fields={emergencyFields}
                                    columns={emergencyColumns}
                                    searchKey="first_name"
                                    disablePagination={true}
                                />
                            </div>
                        </TabsContent>

                        {/* --- 6. TALENTO --- */}
                        <TabsContent value="talent" className="m-0 space-y-8">
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Formación Académica"
                                    icon={GraduationCap}
                                    apiUrl={`/api/talent/education/?person=${id}`}
                                    fields={educationFields}
                                    columns={educationColumns}
                                    searchKey="school_name"
                                    disablePagination={true}
                                />
                            </div>
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Certificaciones y Cursos"
                                    icon={FileText}
                                    apiUrl={`/api/talent/certifications/?person=${id}`}
                                    fields={certificationFields}
                                    columns={certificationColumns}
                                    searchKey="name"
                                    disablePagination={true}
                                />
                            </div>
                            <div className="space-y-4">
                                <CatalogCRUD
                                    title="Idiomas"
                                    icon={Globe}
                                    apiUrl={`/api/talent/person-languages/?person=${id}`}
                                    fields={languageFields}
                                    columns={languageColumns}
                                    searchKey="language_name"
                                    disablePagination={true}
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="flex justify-between border-b pb-2 last:pb-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm">{value || "-"}</span>
        </div>
    );
}

function PersonDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        </div>
    );
}

function PersonError({ router }: { router: any }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar la información de la persona.</p>
            <Button onClick={() => router.back()}>Volver</Button>
        </div>
    );
}
