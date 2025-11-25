'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // 1. Efecto que solo maneja la navegación (side effect)
    useEffect(() => {
        if (!isLoading) {
            let targetPath = null;

            if (!user) {
                targetPath = `/login?returnUrl=${encodeURIComponent(pathname)}`;
            } else if (requireAdmin && !user.is_staff) {
                targetPath = '/';
            }

            if (targetPath) {
                // Usamos router.replace sin setTimeout (el cache se arregló)
                router.replace(targetPath);
            }
        }
    }, [user, isLoading, requireAdmin, router, pathname]);

    // 2. Lógica de Renderizado
    const isAuthenticated = user && (!requireAdmin || user.is_staff);

    if (isLoading || !isAuthenticated) {
        return (
            // CAMBIO CLAVE: Posicionamiento fijo para centrar en el viewport
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-[100]">
                {/* Contenedor que asegura que el fondo semi-transparente oculte el contenido subyacente */}
                <div className="flex items-center justify-center min-h-[50vh] w-full h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // Si está autorizado y listo, renderizamos el contenido
    return <>{children}</>;
}