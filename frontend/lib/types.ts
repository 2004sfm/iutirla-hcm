export interface NavItem { // O el nombre que tengas para la interfaz
    name: string;
    href: string;
    icon: React.ElementType;
    showOnMobile?: boolean;
    requiresAdmin?: boolean; // <--- AGREGA ESTA LÍNEA
}

export interface SidebarProps {
    className?: string
    // navItems?: NavItems[]
}