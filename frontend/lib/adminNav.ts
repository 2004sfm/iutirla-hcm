import {
    LayoutDashboard,
    Users,
    BarChart2,
    Settings,
    Network,
    FileText,
    GraduationCap,
    ClipboardCheck, // <--- 1. IMPORTAMOS EL NUEVO ICONO
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

// ... (Las interfaces NavItem, NavItemGroup y AdminNavItem se quedan IGUAL) ...
export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    items?: never;
}

export interface NavItemGroup {
    name: string;
    icon: LucideIcon;
    href?: never;
    items: {
        name: string;
        href: string;
    }[];
}

export type AdminNavItem = NavItem | NavItemGroup;

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
            { name: "Empleados", href: "/admin/personnel/employees" },
            { name: "Todas las personas", href: "/admin/personnel/people" },
        ],
    },
    {
        name: "Organización",
        icon: Network,
        items: [
            { name: "Departamentos", href: "/admin/organization/departments" },
            { name: "Títulos de cargo", href: "/admin/organization/job-titles" },
            { name: "Posiciones", href: "/admin/organization/positions" },
        ],
    },

    // --- 2. NUEVA SECCIÓN: CAPACITACIÓN ---
    {
        name: "Capacitación",
        icon: GraduationCap,
        items: [
            { name: "Catálogo de Cursos", href: "/admin/training/courses" },
            // Más adelante podrías agregar: { name: "Mis Clases", href: "/admin/training/my-sessions" }
        ],
    },

    {
        name: "Evaluación",
        icon: ClipboardCheck,
        items: [
            { name: "Periodos y Procesos", href: "/admin/performance/periods" },
        ],
    },

    {
        name: "Configuración",
        icon: Settings,
        items: [
            { name: "Catálogos generales", href: "/admin/config/general" },
            { name: "Catálogos de empleo", href: "/admin/config/employment" },
            { name: "Catálogos de talento", href: "/admin/config/talent" },
            { name: "Catálogos de desempeño", href: "/admin/config/performance" },
        ],
    },
];