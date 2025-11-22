"use client"
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SquareArrowOutUpRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from './ui/button'

import { cn } from '@/lib/utils'
import { employeeSidebarItems } from "@/lib/nav";
import { ScrollArea } from './ui/scroll-area'

const basePath = "/employee"

export function EmployeeSidebar() {
    const pathname = usePathname()
    return (
        <Sidebar className="absolute z-5 h-full"> {/* h-[calc(100dvh-var(--header-height))] */}
            <SidebarHeader className="p-0">
                <div className="h-30">
                    <Image
                        src={"/iutirla-porlamar.jpg"}
                        alt="Fotografía institucional, sede colonial IUTURLA Porlamar"
                        width={426}
                        height={426}
                        className="h-full object-cover"
                        loading="eager"
                    />
                </div>
                <section className="h-full flex flex-col gap-2 p-2">

                    <div className="flex justify-between items-end h-8 pl-2">
                        <Avatar className="size-20 border border-background">
                            <AvatarImage src="/profile.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Button size={"sm"}>
                            <SquareArrowOutUpRight />
                            <span>Mas opciones</span>
                        </Button>
                    </div>
                    <div className="flex flex-col gap-1 px-2">
                        <h2 className="text-lg font-bold">Santiago Fermin</h2>
                        <span className="text-xs text-gray-600">Coordinador Administrativo</span>
                        <span className="text-xs text-gray-600">Mar</span>
                    </div>
                </section>
            </SidebarHeader>
            <SidebarContent>
                <ScrollArea className="w-full h-full">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {employeeSidebarItems.map((item) => {
                                    const href = `${basePath}${item.href}`
                                    const isActive = pathname.startsWith(href)
                                    return (
                                        <SidebarMenuItem key={item.name}>
                                            <SidebarMenuButton className={cn(
                                                isActive && "bg-sidebar-primary text-white hover:bg-sidebar-primary hover:text-white"
                                            )} asChild>
                                                <Link href={href}>
                                                    <item.icon />
                                                    <span>{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </ScrollArea>
            </SidebarContent>
        </Sidebar >
    )
}