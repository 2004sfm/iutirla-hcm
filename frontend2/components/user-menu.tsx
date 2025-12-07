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
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";

import { useAuth } from "@/context/auth-context";

export function UserMenu() {
    const { user, logout } = useAuth();

    const displayName = user?.person
        ? `${user.person.first_name} ${user.person.paternal_surname}`
        : user?.username || "Usuario";

    const getInitials = () => {
        if (user?.person) {
            const first = user.person.first_name[0];
            const last = user.person.paternal_surname[0];
            return `${first}${last}`.toUpperCase();
        }
        return user?.username?.slice(0, 2).toUpperCase() || "U";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-10 rounded-full ring-2 ring-slate-200 hover:ring-slate-300 transition-all">
                    <Avatar>
                        <AvatarImage
                            src={user?.person?.photo || undefined}
                            alt={displayName}
                        />
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-medium">{getInitials()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            @{user?.username}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Ajustes</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

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
