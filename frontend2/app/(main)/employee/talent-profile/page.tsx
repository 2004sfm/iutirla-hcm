"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import apiClient from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Loader2, GraduationCap, FileText, Globe, Pencil
} from "lucide-react";

// Data types
interface Education {
    id: number;
    level_name: string;
    field_of_study_name: string;
    school_name: string;
    start_date: string;
    end_date?: string | null;
    is_current: boolean;
}

interface Certification {
    id: number;
    name: string;
    institution: string;
    effective_date: string;
    expiration_date?: string | null;
    credential_id?: string | null;
    url?: string | null;
}

interface Language {
    id: number;
    language_name: string;
    speaking_proficiency_name: string;
    reading_proficiency_name: string;
    writing_proficiency_name: string;
}

interface PersonData {
    id: number;
    full_name: string;
    educations?: Education[];
    certifications?: Certification[];
    languages?: Language[];
}

export default function TalentProfilePage() {
    const { user } = useAuth();
    const [person, setPerson] = useState<PersonData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const personId = user?.person?.id;

            if (personId) {
                try {
                    setLoading(true);
                    const { data } = await apiClient.get(`/api/core/persons/${personId}/`);
                    setPerson(data);
                } catch (error) {
                    console.error("Error cargando datos de talento", error);
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
                    <h1 className="text-2xl font-bold tracking-tight">Perfil de Talento</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualiza tu formación académica, certificaciones y habilidades
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pb-8">

                {/* 1. FORMACIÓN ACADÉMICA */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Formación Académica
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.educations && person.educations.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.educations.map((edu) => (
                                    <div key={edu.id} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Nivel:</span>
                                            <span className="text-sm font-medium">{val(edu.level_name)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Campo de Estudio:</span>
                                            <span className="text-sm font-medium">{val(edu.field_of_study_name)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Institución:</span>
                                            <span className="text-sm font-medium">{edu.school_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Fecha Inicio:</span>
                                            <span className="text-sm font-medium">{edu.start_date}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Fecha Fin:</span>
                                            <span className="text-sm font-medium">
                                                {edu.is_current ? "Cursando actualmente" : (edu.end_date || val(null))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No hay registros de formación académica.</span>
                        )}
                    </CardContent>
                </Card>

                {/* 2. CERTIFICACIONES Y CURSOS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Certificaciones y Cursos
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.certifications && person.certifications.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.certifications.map((cert) => (
                                    <div key={cert.id} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Nombre:</span>
                                            <span className="text-sm font-medium">{cert.name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Institución:</span>
                                            <span className="text-sm font-medium">{cert.institution}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Fecha Emisión:</span>
                                            <span className="text-sm font-medium">{cert.effective_date}</span>
                                        </div>
                                        {cert.expiration_date && (
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">Fecha Expiración:</span>
                                                <span className="text-sm font-medium">{cert.expiration_date}</span>
                                            </div>
                                        )}
                                        {cert.credential_id && (
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">ID Credencial:</span>
                                                <span className="text-sm font-medium">{cert.credential_id}</span>
                                            </div>
                                        )}
                                        {cert.url && (
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">URL:</span>
                                                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
                                                    {cert.url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No hay certificaciones registradas.</span>
                        )}
                    </CardContent>
                </Card>

                {/* 3. IDIOMAS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Idiomas
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Pencil className="size-4 text-primary" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {person.languages && person.languages.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {person.languages.map((lang) => (
                                    <div key={lang.id} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Idioma:</span>
                                            <span className="text-sm font-medium">{lang.language_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Habla:</span>
                                            <span className="text-sm font-medium">{lang.speaking_proficiency_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Lectura:</span>
                                            <span className="text-sm font-medium">{lang.reading_proficiency_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Escritura:</span>
                                            <span className="text-sm font-medium">{lang.writing_proficiency_name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm italic text-muted-foreground">No hay idiomas registrados.</span>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
