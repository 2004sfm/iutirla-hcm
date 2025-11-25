'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // 1. Importamos el contexto
import Link from "next/link"; // Para navegar al perfil
import { LogOut, User, Settings } from "lucide-react"; // Iconos opcionales para mejor UX

export function UserMenu() {
    // 2. Obtenemos el usuario y la función logout del contexto
    const { user, logout } = useAuth();

    // 3. Lógica para obtener el nombre a mostrar
    // Si tiene ficha de persona, usamos Nombre + Apellido. Si no, el Username.
    const displayName = user?.person
        ? `${user.person.first_name} ${user.person.paternal_surname}`
        : user?.username || "Usuario";

    // 4. Lógica para las iniciales (Avatar Fallback)
    const getInitials = () => {
        if (user?.person) {
            const first = user.person.first_name[0];
            const last = user.person.paternal_surname[0];
            return `${first}${last}`.toUpperCase();
        }
        // Si no tiene persona, usamos las dos primeras letras del username
        return user?.username?.slice(0, 2).toUpperCase() || "U";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-10 rounded-full">
                    <Avatar>
                        {/* 5. Foto dinámica: Si existe user.person.photo, la usamos */}
                        <AvatarImage
                            src={user?.person?.photo || undefined}
                            alt={displayName}
                        />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {/* Mostramos el username o el cargo si lo tuvieras en el contexto */}
                            @{user?.username}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Opción de Perfil */}
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </Link>
                </DropdownMenuItem>

                {/* Opción de Ajustes */}
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Ajustes</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 6. Conectamos el Logout */}
                <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}