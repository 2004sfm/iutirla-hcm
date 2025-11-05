import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils"
import { SidebarProps } from "@/lib/types";
import { mainSiteSidebarItems } from "@/lib/nav";

export function SiteSidebar({ className }: SidebarProps) {
    return (
        <aside className={cn("flex items-end overflow-hidden md:border-0 md:border-r border-t shadow-[0_-4px_6px_-1px,0_-2px_4px_-2px] md:shadow-[4px_0px_6px_-1px,2px_0px_4px_-2px] shadow-black/10", className)}
        >
            <nav className="w-full h-full flex flex-col p-1 overflow-y-auto overflow-x-hidden">
                <ul className="flex justify-around md:flex-col gap-1">
                    {mainSiteSidebarItems.map((item) => {
                        return (
                            <li key={item.name}
                                className={cn("h-[55px] hover:bg-secondary rounded-xl flex justify-center items-center", !item.showOnMobile && "hidden md:flex")}>
                                <Link href={item.href} className="w-full h-full flex flex-col justify-center items-center">
                                    <item.icon className="size-6" />
                                    <span className="text-[8px] font-medium truncate">{item.name}</span>
                                </Link>
                            </li>
                        )
                    })}
                    <li className="h-[55px] hover:bg-secondary rounded-xl flex justify-center items-center md:hidden">
                        <Link href="#" className="w-full h-full flex flex-col justify-center items-center p-1">
                            <MoreHorizontal className="size-6" />
                            <span className="text-[8px] font-medium text-center">Más</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}