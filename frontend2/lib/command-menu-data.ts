import {
    User,
    Calendar,
    Settings,
    UserCircle,
    Users
} from "lucide-react";

export const commandSections = [
    {
        heading: 'Sugerencias',
        items: [
            {
                name: 'Calendario',
                icon: Calendar
            }
        ]
    },
    {
        heading: 'Ajustes',
        items: [
            {
                name: 'Perfil',
                icon: UserCircle
            },
            {
                name: 'Ajustes',
                icon: Settings
            }
        ]
    },
    {
        heading: 'Usuarios',
        items: [
            {
                name: 'Santiago Fermin',
                icon: User
            }
        ]
    },
    {
        heading: 'Equipos',
        items: [
            {
                name: 'Coordinacion administrativa',
                icon: Users
            }
        ]
    }
];
