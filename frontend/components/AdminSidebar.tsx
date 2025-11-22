"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/lib/utils'
import { adminSidebarItems, AdminNavItem } from "@/lib/adminNav"

export function AdminSidebar() {
    return (
        <Sidebar className="absolute z-5 h-full">
            <SidebarHeader className="px-4">
                Administrador
            </SidebarHeader>
            <SidebarContent>
                <ScrollArea className="w-full h-full">
                    <SidebarGroup>
                        <SidebarMenu>
                            {adminSidebarItems.map((item) => (
                                <AdminSidebarNavItem key={item.name} item={item} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </ScrollArea>
            </SidebarContent>
        </Sidebar >
    )
}

function AdminSidebarNavItem({ item }: { item: AdminNavItem }) {
    const pathname = usePathname()
    if (!item.items) {
        const isActive = pathname.startsWith(item.href);
        return (
            <SidebarMenuItem>
                <SidebarMenuButton className={cn(
                    isActive && "bg-sidebar-primary text-white hover:bg-sidebar-primary hover:text-white"
                )} asChild>
                    <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    const isGroupActive = item.items.some((sub) => pathname.startsWith(sub.href));

    return (
        <SidebarMenuItem>
            <Collapsible
                className="group/collapsible"
                defaultOpen={isGroupActive}
            >
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items.map((subItem) => {
                            const isActive = pathname.startsWith(subItem.href);
                            return (
                                <SidebarMenuSubItem key={subItem.name}>
                                    <SidebarMenuButton className={cn(
                                        isActive && "bg-sidebar-primary text-white hover:bg-sidebar-primary hover:text-white"
                                    )} asChild>
                                        <Link href={subItem.href}>
                                            {subItem.name}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuSubItem>
                            )
                        })}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem >
    )
}