"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Network,
    GraduationCap,
    Briefcase,
    ClipboardCheck,
    Settings,
    ChevronRight,
    ChevronDown,
    Circle,
    ContactRound,
    Building2,
    Calculator,
    Clock,
    PiggyBank,
    Gauge,
    TrendingUpDown,
    BookOpenText,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IutirlaLogo } from "../iutirla-logo";

interface SidebarProps {
    collapsed: boolean;
    role?: "admin" | "employee";
}

interface MenuItem {
    label: string;
    icon: React.ElementType;
    badge?: {
        text: string;
        variant: "primary" | "secondary" | "tertiary";
    };
    children?: {
        label: string;
        href: string;
        icon: React.ElementType;
    }[];
    href?: string;
}

const employeeMenuItems: MenuItem[] = [
    {
        label: "Datos Personales",
        href: "/employee/personal-data",
        icon: ContactRound,
    },
    {
        label: "Datos del Puesto",
        href: "/employee/job-data",
        icon: Building2,
    },
    {
        label: "Compensación",
        href: "/employee/compensation",
        icon: Calculator,
    },
    {
        label: "Gestión del Tiempo",
        href: "/employee/time-management",
        icon: Clock,
    },
    {
        label: "Beneficios",
        href: "/employee/benefits",
        icon: PiggyBank,
    },
    {
        label: "Rendimiento y Metas",
        href: "/employee/performance-goals",
        icon: Gauge,
    },
    {
        label: "Sucesión",
        href: "/employee/succession",
        icon: TrendingUpDown,
    },
    {
        label: "Aprendizaje y Desarrollo",
        href: "/employee/learning-development",
        icon: BookOpenText,
    },
    {
        label: "Perfil de Talento",
        href: "/employee/talent-profile",
        icon: ClipboardList,
    },
];

const adminMenuItems: MenuItem[] = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard"
    },
    {
        label: "Gestión de Personal",
        icon: Users,
        children: [
            { label: "Empleados", href: "/admin/personnel/employees", icon: Circle },
            { label: "Todas las personas", href: "/admin/personnel/people", icon: Circle },
        ],
    },
    {
        label: "Organización",
        icon: Network,
        href: "/admin/organization"
    },
    {
        label: "Capacitación",
        icon: GraduationCap,
        children: [
            { label: "Catálogo de Cursos", href: "/admin/training/courses", icon: Circle },
        ],
    },
    {
        label: "Reclutamiento",
        icon: Briefcase,
        children: [
            { label: "Vacantes", href: "/admin/ats/jobs", icon: Circle },
            { label: "Candidatos", href: "/admin/ats/candidates", icon: Circle },
        ],
    },
    {
        label: "Evaluación",
        icon: ClipboardCheck,
        children: [
            { label: "Periodos y Procesos", href: "/admin/performance/periods", icon: Circle },
        ],
    },
    {
        label: "Configuración",
        icon: Settings,
        children: [
            { label: "Catálogos generales", href: "/admin/config/general", icon: Circle },
            { label: "Catálogos de talento", href: "/admin/config/talent", icon: Circle },
            { label: "Catálogos de desempeño", href: "/admin/config/performance", icon: Circle },
        ],
    },
    {
        label: "Mi Información",
        icon: ContactRound,
        children: employeeMenuItems.map(item => ({
            label: item.label,
            href: item.href || "#",
            icon: item.icon
        }))
    }
];

export function SidebarContent({ collapsed, role = "admin" }: { collapsed: boolean; role?: "admin" | "employee" }) {
    const [expandedItems, setExpandedItems] = useState<string[]>(["Personal"]);
    const pathname = usePathname();
    const menuItems = role === "admin" ? adminMenuItems : employeeMenuItems;

    const toggleItem = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const getBadgeClasses = (variant: "primary" | "secondary" | "tertiary") => {
        switch (variant) {
            case "primary":
                return "bg-brand-primary text-brand-primary-foreground";
            case "secondary":
                return "bg-brand-secondary text-brand-secondary-foreground";
            case "tertiary":
                return "bg-brand-tertiary text-brand-tertiary-foreground";
        }
    };

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
    const isChildActive = (children: { href: string }[]) => children.some(child => isActive(child.href));

    return (
        <div className="flex flex-col h-full">
            {/* Sidebar Header (Brand) */}
            <div className="h-14 flex items-center border-b border-border shrink-0 overflow-hidden transition-all duration-300">
                <div className="flex items-center h-full w-full transition-all duration-300">
                    <IutirlaLogo collapsed={collapsed} />
                </div>
            </div>

            {/* Navigation */}
            <nav className={cn("overflow-y-auto overflow-x-hidden flex-1 my-2")}>
                <ul className="space-y-1">
                    {menuItems.map((item, index) => {
                        const isExpanded = expandedItems.includes(item.label);
                        const hasChildren = item.children && item.children.length > 0;
                        const isLink = !hasChildren && item.href;

                        // Determine active states
                        const isItemActive = isLink && item.href ? isActive(item.href) : false;
                        const isParentActive = hasChildren && item.children ? isChildActive(item.children) : false;

                        const ItemContent = (
                            <>
                                <div className={cn(
                                    "w-12 flex items-center justify-center shrink-0 transition-colors self-stretch",
                                    isItemActive ? "text-white" : (isParentActive ? "text-brand-primary" : "text-muted-foreground")
                                )}>
                                    <item.icon className="size-5" />
                                </div>

                                {!collapsed && (
                                    <div className="flex-1 flex items-center min-w-0 pr-3 py-2.5">
                                        <span className={cn(
                                            "flex-1 text-sm text-left font-medium truncate",
                                            isItemActive ? "text-white" : (isParentActive ? "text-brand-primary" : "text-foreground")
                                        )}>
                                            {item.label}
                                        </span>

                                        {item.badge && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold ml-2",
                                                getBadgeClasses(item.badge.variant)
                                            )}>
                                                {item.badge.text}
                                            </span>
                                        )}

                                        {hasChildren && (
                                            <div className={cn(
                                                "ml-2",
                                                isParentActive ? "text-brand-primary" : "text-muted-foreground"
                                            )}>
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 top-0">
                                        <span className="text-sm text-foreground font-medium">
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span className={cn(
                                                "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                getBadgeClasses(item.badge.variant)
                                            )}>
                                                {item.badge.text}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </>
                        );

                        const itemClasses = cn(
                            "flex items-center transition-colors relative group min-h-[44px] mx-2 rounded-lg w-[calc(100%-16px)] cursor-pointer",
                            isItemActive
                                ? "bg-brand-primary hover:bg-brand-primary/90"
                                : (isParentActive
                                    ? "bg-brand-primary/10 hover:bg-brand-primary/20"
                                    : "hover:bg-accent"),
                            isExpanded && hasChildren && !isParentActive && "bg-muted"
                        );

                        return (
                            <li key={index}>
                                {/* Parent Item */}
                                {isLink ? (
                                    <Link href={item.href!} className={itemClasses} title={collapsed ? item.label : undefined}>
                                        {ItemContent}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => hasChildren && toggleItem(item.label)}
                                        className={itemClasses}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        {ItemContent}
                                    </button>
                                )}

                                {/* Children Items */}
                                {hasChildren && isExpanded && (
                                    <ul className="mt-1 space-y-1">
                                        {item.children?.map((child, childIndex) => {
                                            const isChildItemActive = isActive(child.href);

                                            return (
                                                <li key={childIndex}>
                                                    <Link
                                                        href={child.href}
                                                        className={cn(
                                                            "flex items-center transition-colors relative group min-h-[44px] mx-2 rounded-lg w-[calc(100%-16px)]",
                                                            isChildItemActive
                                                                ? "bg-brand-primary hover:bg-brand-primary/90"
                                                                : "hover:bg-accent"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-12 flex items-center justify-center shrink-0 transition-colors self-stretch",
                                                            isChildItemActive ? "text-white" : "text-muted-foreground"
                                                        )}>
                                                            <child.icon className="size-5" />
                                                        </div>
                                                        {!collapsed && (
                                                            <div className="flex-1 flex items-center min-w-0 pr-3 py-2.5">
                                                                <span className={cn(
                                                                    "flex-1 text-sm text-left font-medium truncate",
                                                                    isChildItemActive ? "text-white" : "text-foreground"
                                                                )}>
                                                                    {child.label}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {/* Tooltip for collapsed state (Child) */}
                                                        {collapsed && (
                                                            <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 top-0">
                                                                <span className="text-sm text-foreground font-medium">
                                                                    {child.label}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}

export function Sidebar({ collapsed, role = "admin" }: SidebarProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isEffectiveCollapsed = collapsed && !isHovered;

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 overflow-hidden flex flex-col shadow-[6px_0_15px_-4px_rgba(0,0,0,0.15)]",
                isEffectiveCollapsed ? "w-16" : "w-64"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <SidebarContent collapsed={isEffectiveCollapsed} role={role} />
        </aside>
    );
}
