import * as React from "react"
import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export interface BreadcrumbItemType {
    name: string;
    href: string;
}

interface AdminHeaderProps {
    items: BreadcrumbItemType[];
}

export function AdminHeader({ items }: AdminHeaderProps) {
    return (
        <header className="flex items-center h-10 border-b px-2 py-6">
            <SidebarTrigger className="ml-2" />
            <Separator
                orientation="vertical"
                className="mx-3 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
                <BreadcrumbList>
                    {items.map((item, index) => (
                        <React.Fragment key={item.name}>
                            <BreadcrumbItem>
                                {index === items.length - 1 ? (
                                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={item.href}>{item.name}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {index < items.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>

        </header>
    )
}