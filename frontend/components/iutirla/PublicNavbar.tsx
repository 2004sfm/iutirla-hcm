"use client";

import Link from "next/link";
import { Building2, Facebook, Instagram, Linkedin } from "lucide-react";

export default function PublicNavbar() {
    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/portal" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <span className="text-xl font-bold">I</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">IUTIRLA</span>
                    </Link>

                    <div className="hidden md:flex md:items-center md:gap-8">
                        <Link href="/portal" className="text-sm font-medium text-slate-600 hover:text-blue-600">
                            Inicio
                        </Link>
                        <Link href="/portal/jobs" className="text-sm font-medium text-slate-600 hover:text-blue-600">
                            Vacantes
                        </Link>
                        <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">
                            Nosotros
                        </Link>
                        <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">
                            Beneficios
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                            Soy Empleado
                        </Link>
                        <Link
                            href="/portal/jobs"
                            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Ver Vacantes
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
