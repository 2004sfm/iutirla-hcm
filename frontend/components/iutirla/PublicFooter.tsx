import { Building2, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function PublicFooter() {
    return (
        <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Logo y descripción */}
                    <div className="md:col-span-2">
                        <div className="mb-4 flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-blue-400" />
                            <span className="text-xl font-bold text-white">IUTIRLA</span>
                        </div>
                        <p className="mb-4 text-sm text-slate-400">
                            Instituto Universitario de Tecnología Industrial Rodolfo Loero Arismendi.
                            Formando profesionales de excelencia desde 1974.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 font-semibold text-slate-900">Enlaces Rápidos</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>
                                <Link href="/portal" className="hover:text-blue-600">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/portal/jobs" className="hover:text-blue-600">
                                    Vacantes Disponibles
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-blue-600">
                                    Sobre Nosotros
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-blue-600">
                                    Beneficios
                                </Link>
                            </li>
                        </ul>
                    </div>
                    {/* Contacto */}
                    <div>
                        <h3 className="mb-4 font-semibold text-white">Contacto</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 flex-shrink-0 text-blue-400" />
                                <span>Caracas, Venezuela</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-400" />
                                <span>+58 123-456-7890</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-400" />
                                <span>rrhh@iutirla.edu.ve</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} IUTIRLA. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
