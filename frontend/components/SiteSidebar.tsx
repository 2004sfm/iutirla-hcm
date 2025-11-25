'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils"
import { mainSiteSidebarItems } from "@/lib/nav";
import { ScrollArea } from "@/components/ui/scroll-area";

// 1. IMPORTAR EL CONTEXTO DE AUTENTICACIÓN
import { useAuth } from "@/context/AuthContext";

interface SiteSidebarProps {
    className?: string;
    // isAdmin ya no es necesario recibirlo como prop
}

export function SiteSidebar({ className }: SiteSidebarProps) {
    const currentPath = usePathname();

    // 2. OBTENER USUARIO DEL CONTEXTO
    const { user } = useAuth();

    // 3. DETERMINAR SI ES ADMIN DINÁMICAMENTE
    const isAdmin = user?.is_staff || false;

    // 4. FILTRAR ELEMENTOS
    const filteredItems = mainSiteSidebarItems.filter(item => {
        // Si requiere admin, verificamos el flag
        if (item.requiresAdmin) {
            return isAdmin;
        }
        // Si no, se muestra a todos
        return true;
    });

    return (
        <aside className={cn("flex items-end overflow-hidden md:border-0 md:border-r border-t shadow-[0_-4px_6px_-1px,0_-2px_4px_-2px] md:shadow-[4px_0px_6px_-1px,2px_0px_4px_-2px] shadow-black/10", className)}>
            <ScrollArea className="w-full h-full">
                <nav className="w-full h-full flex flex-col p-1">
                    <ul className="flex justify-around md:flex-col gap-1">
                        {filteredItems.map((item) => {
                            // Comprobación de ruta activa
                            const isSelected = currentPath.startsWith(item.href) && item.href !== '#';

                            return (
                                <li key={item.name}
                                    className={cn(
                                        "h-[55px] hover:bg-secondary rounded-xl flex justify-center items-center transition-colors",
                                        !item.showOnMobile && "hidden md:flex",
                                        // Estilos de selección
                                        isSelected && "bg-primary hover:bg-primary text-primary-foreground"
                                    )}>
                                    <Link
                                        href={item.href}
                                        className="w-full h-full flex flex-col justify-center items-center"
                                    >
                                        <item.icon
                                            className={cn(
                                                "size-6 mb-1", // Ajusté un poco el margen
                                                isSelected ? "text-primary-foreground" : "text-foreground"
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                "text-[8px] font-medium truncate max-w-[60px]", // Aumenté un poco el texto para legibilidad
                                                isSelected ? "text-primary-foreground" : "text-foreground"
                                            )}
                                        >
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            )
                        })}

                        {/* Botón Más (Móvil) */}
                        <li className="h-[55px] hover:bg-secondary rounded-xl flex justify-center items-center md:hidden">
                            <Link href="#" className="w-full h-full flex flex-col justify-center items-center p-1">
                                <MoreHorizontal className="size-6 text-foreground" />
                                <span className="text-[10px] font-medium text-center text-foreground">Más</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </ScrollArea>
        </aside>
    )
}