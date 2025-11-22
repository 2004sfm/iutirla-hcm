// lib/adminNav.ts
import {
    LayoutDashboard,
    Users,
    BarChart2,
    Settings,
    Network,
    FileText,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

// Definimos los tipos para nuestros items
export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    items?: never; // Un enlace simple no tiene 'items'
}

export interface NavItemGroup {
    name: string;
    icon: LucideIcon;
    href?: never; // Un grupo no tiene 'href' principal
    items: {
        name: string;
        href: string;
    }[];
}

// Un tipo de unión para que nuestro array acepte ambos
export type AdminNavItem = NavItem | NavItemGroup;

// Esta es la data que usará tu sidebar (basada en nuestra última discusión)
export const adminSidebarItems: AdminNavItem[] = [
    {
        name: "Panel de Control",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Gestión de Personal",
        icon: Users,
        items: [
            { name: "Empleados", href: "/admin/employees" }, // Solo activos
            { name: "Todas las personas", href: "/admin/personnel" },        // Base de datos global
        ],
    },
    {
        name: "Organización",
        icon: Network,
        items: [
            { name: "Departamentos", href: "/admin/organization/departments" },
            { name: "Titulos de cargo", href: "/admin/organization/job-titles" },
            { name: "Posiciones", href: "/admin/organization/positions" },
        ],
    },
    {
        name: "Contratos y Reportes",
        icon: FileText,
        items: [
            { name: "Contratos", href: "/admin/reports/contracts" },
            { name: "Historial de movimientos", href: "/admin/reports/status" },
        ],
    },
    {
        name: "Configuración",
        icon: Settings,
        items: [
            { name: "Catálogos generales", href: "/admin/config/general" },
            { name: "Catálogos de empleo", href: "/admin/config/employment" },
            { name: "Catálogos de talento", href: "/admin/config/talent" },
        ],
    },
];