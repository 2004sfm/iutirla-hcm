export type NavItems = {
    name: string;
    href: string;
    icon: React.ElementType;
    showOnMobile?: boolean;
};

export interface SidebarProps {
    className?: string
    // navItems?: NavItems[]
}