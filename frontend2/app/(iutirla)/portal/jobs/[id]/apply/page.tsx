"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface JobPosting {
    id: number;
    title: string;
    position_title: string | null;
    department_name: string | null;
}

export default function ApplyJobPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [phoneCodes, setPhoneCodes] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        national_id_type: "V",
        national_id: "",
        phone_area_code: "",
        phone_subscriber: "",
        cover_letter: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const documentTypes = [
        { value: "V", label: "V - Venezolano" },
        { value: "E", label: "E - Extranjero" },
        { value: "J", label: "J - Jurídico" },
        { value: "G", label: "G - Gubernamental" },
        { value: "P", label: "P - Pasaporte" },
    ];

    useEffect(() => {
        if (!id) return;

        // Cargar job
        fetch(`http://localhost:8000/api/ats/public/jobs/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Vacante no encontrada");
                return res.json();
            })
            .then((data) => {
                setJob(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error al cargar la vacante");
                setLoading(false);
            });

        // Cargar códigos de teléfono
        fetch("http://localhost:8000/api/ats/public/phone-codes/")
            .then((res) => res.json())
            .then((data) => setPhoneCodes(data))
            .catch((err) => console.error("Error loading phone codes:", err));
    }, [id]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Validar nombre
        if (!formData.first_name.trim()) {
            newErrors.first_name = "El nombre es obligatorio";
        } else if (formData.first_name.trim().length < 2) {
            newErrors.first_name = "El nombre debe tener al menos 2 caracteres";
        } else if (/\d/.test(formData.first_name)) {
            newErrors.first_name = "El nombre no puede contener números";
        }

        // Validar apellido
        if (!formData.last_name.trim()) {
            newErrors.last_name = "El apellido es obligatorio";
        } else if (formData.last_name.trim().length < 2) {
            newErrors.last_name = "El apellido debe tener al menos 2 caracteres";
        } else if (/\d/.test(formData.last_name)) {
            newErrors.last_name = "El apellido no puede contener números";
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "El email es obligatorio";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Email inválido";
        }

        // Validar cédula
        if (!formData.national_id.trim()) {
            newErrors.national_id = "La cédula es obligatoria";
        } else if (formData.national_id.trim().length < 5) {
            newErrors.national_id = "La cédula es inválida";
        } else if (!/^[0-9]+$/.test(formData.national_id.trim())) {
            newErrors.national_id = "La cédula solo debe contener números";
        }

        // Validar teléfono
        if (!formData.phone_area_code) {
            newErrors.phone_area_code = "Selecciona el código de área";
        }
        if (!formData.phone_subscriber.trim()) {
            newErrors.phone_subscriber = "El número de teléfono es obligatorio";
        } else if (formData.phone_subscriber.trim().length < 7) {
            newErrors.phone_subscriber = "El número debe tener al menos 7 dígitos";
        } else if (!/^[0-9]+$/.test(formData.phone_subscriber.trim())) {
            newErrors.phone_subscriber = "El teléfono solo debe contener números";
        }

        // Validar CV
        if (!cvFile) {
            newErrors.cv = "El CV es obligatorio";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === "application/pdf") {
                if (file.size <= 5 * 1024 * 1024) {
                    setCvFile(file);
                    setErrors({ ...errors, cv: "" });
                } else {
                    toast.error("El archivo es muy grande. Máximo 5 MB.");
                }
            } else {
                toast.error("Solo se permiten archivos PDF");
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/pdf") {
                if (file.size <= 5 * 1024 * 1024) {
                    setCvFile(file);
                    setErrors({ ...errors, cv: "" });
                } else {
                    toast.error("El archivo es muy grande. Máximo 5 MB.");
                }
            } else {
                toast.error("Solo se permiten archivos PDF");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Por favor corrige los errores del formulario");
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading("Enviando postulación...");

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("job_posting", id);
            formDataToSend.append("first_name", formData.first_name.trim());
            formDataToSend.append("last_name", formData.last_name.trim());
            formDataToSend.append("email", formData.email.trim());
            formDataToSend.append("phone_area_code", formData.phone_area_code);
            formDataToSend.append("phone_subscriber", formData.phone_subscriber.trim());
            formDataToSend.append("national_id", `${formData.national_id_type}-${formData.national_id.trim()}`);
            formDataToSend.append("cv_file", cvFile!);

            if (formData.cover_letter.trim()) {
                formDataToSend.append("cover_letter", formData.cover_letter.trim());
            }

            const res = await fetch("http://localhost:8000/api/ats/public/apply/", {
                method: "POST",
                body: formDataToSend,
            });

            if (!res.ok) {
                const errorData = await res.json();

                // Parse backend errors
                const errors: string[] = [];
                for (const [field, messages] of Object.entries(errorData)) {
                    if (Array.isArray(messages)) {
                        errors.push(...messages);
                    } else if (typeof messages === "string") {
                        errors.push(messages);
                    }
                }

                if (errors.length > 0) {
                    errors.forEach(err => toast.error(err));
                    toast.dismiss(toastId);
                    return;
                }

                throw new Error(JSON.stringify(errorData));
            }

            toast.success("¡Postulación enviada exitosamente!", { id: toastId });
            router.push("/portal/jobs");
        } catch (error: any) {
            console.error(error);
            toast.error("Error al enviar la postulación. Por favor intenta de nuevo.", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Cargando...</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Vacante no encontrada</h1>
                <Link href="/portal/jobs">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a vacantes
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <Link href={`/portal/jobs/${id}`}>
                <Button variant="ghost" className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a la vacante
                </Button>
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Postulación para {job.title}</CardTitle>
                    <CardDescription className="text-base">
                        {job.position_title} - {job.department_name}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Summary */}
                        {Object.keys(errors).length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Por favor corrige los siguientes errores</AlertTitle>
                                <AlertDescription>
                                    <ul className="mt-2 list-disc list-inside space-y-1">
                                        {Object.values(errors).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Información Personal */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-slate-900">Información Personal</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nombre *</Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className={errors.first_name ? "border-red-500" : ""}
                                    />
                                    {errors.first_name && (
                                        <p className="text-sm text-red-600">{errors.first_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Apellido *</Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className={errors.last_name ? "border-red-500" : ""}
                                    />
                                    {errors.last_name && (
                                        <p className="text-sm text-red-600">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="juan.perez@ejemplo.com"
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="national_id_type">Tipo *</Label>
                                    <Select
                                        value={formData.national_id_type}
                                        onValueChange={(value) => setFormData({ ...formData, national_id_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label htmlFor="national_id">Número de Cédula *</Label>
                                    <Input
                                        id="national_id"
                                        value={formData.national_id}
                                        onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                                        placeholder="12345678"
                                        className={errors.national_id ? "border-red-500" : ""}
                                    />
                                    {errors.national_id && (
                                        <p className="text-sm text-red-600">{errors.national_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Teléfono *</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    <div className="col-span-2">
                                        <Select
                                            value={formData.phone_area_code}
                                            onValueChange={(value) => setFormData({ ...formData, phone_area_code: value })}
                                        >
                                            <SelectTrigger className={errors.phone_area_code ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Código" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {phoneCodes.map((code) => (
                                                    <SelectItem key={code.id} value={code.id.toString()}>
                                                        {code.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.phone_area_code && (
                                            <p className="text-sm text-red-600 mt-1">{errors.phone_area_code}</p>
                                        )}
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            id="phone_subscriber"
                                            value={formData.phone_subscriber}
                                            onChange={(e) => setFormData({ ...formData, phone_subscriber: e.target.value })}
                                            placeholder="1234567"
                                            className={errors.phone_subscriber ? "border-red-500" : ""}
                                        />
                                        {errors.phone_subscriber && (
                                            <p className="text-sm text-red-600 mt-1">{errors.phone_subscriber}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CV Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="cv">Curriculum Vitae (PDF) *</Label>
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${isDragging
                                        ? "border-brand-primary bg-purple-50"
                                        : cvFile
                                            ? "border-green-500 bg-green-50"
                                            : errors.cv
                                                ? "border-red-500"
                                                : "border-slate-300 hover:border-brand-primary hover:bg-purple-50/50"
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById("cv")?.click()}
                            >
                                <input
                                    id="cv"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {cvFile ? (
                                    <div className="text-center">
                                        <div className="mb-3 flex justify-center">
                                            <div className="rounded-full bg-green-100 p-3">
                                                <Upload className="h-8 w-8 text-green-600" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-semibold text-green-700 mb-1">
                                            {cvFile.name}
                                        </p>
                                        <p className="text-sm text-slate-600 mb-2">
                                            {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCvFile(null);
                                            }}
                                        >
                                            Cambiar archivo
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="mb-3 flex justify-center">
                                            <div className="rounded-full bg-purple-100 p-3">
                                                <Upload className="h-8 w-8 text-brand-primary" />
                                            </div>
                                        </div>
                                        <p className="text-base font-medium text-slate-700 mb-1">
                                            Arrastra tu CV aquí o haz clic para seleccionar
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Solo archivos PDF. Máximo 5 MB.
                                        </p>
                                    </div>
                                )}
                            </div>
                            {errors.cv && (
                                <p className="text-sm text-red-600">{errors.cv}</p>
                            )}
                        </div>

                        {/* Carta de Presentación */}
                        <div className="space-y-2">
                            <Label htmlFor="cover_letter">Carta de Presentación (Opcional)</Label>
                            <Textarea
                                id="cover_letter"
                                rows={6}
                                value={formData.cover_letter}
                                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                                placeholder="Cuéntanos por qué te interesa esta posición y qué puedes aportar al equipo..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-brand-primary hover:bg-brand-primary/90"
                                size="lg"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Enviar Postulación
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Al enviar esta postulación, aceptas compartir tu información con IUTIRLA para fines de reclutamiento.
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
