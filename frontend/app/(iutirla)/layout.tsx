import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import PublicNavbar from "@/components/iutirla/PublicNavbar";
import PublicFooter from "@/components/iutirla/PublicFooter";
import "../globals.css"

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Trabaja con Nosotros | IUTIRLA",
    description: "Únete al equipo IUTIRLA. Descubre oportunidades de carrera y postúlate a nuestras vacantes disponibles.",
};

export default function IutirlaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={`${outfit.className} flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`}>
                <PublicNavbar />
                <main className="flex-1">
                    {children}
                </main>
                <PublicFooter />
            </body>
        </html>
    );
}
