import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./CommandMenu";
import { TaskSheet } from "./TaskSheet";
import { NotificationsSheet } from "./NotificationsSheet";
import { UserMenu } from "./UserMenu";
import { IutirlaLogo } from "./IutirlaLogo";

interface SiteHeaderProps {
    className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
    return (
        <header className={cn("border-b shadow-sm flex px-2 md:px-4", className)}>
            <div className="h-full flex md:flex-1 items-center"> {/* shrink-0 */}
                <Link href="/" aria-label="Volver a la página de inicio">
                    <IutirlaLogo />
                </Link>
            </div>

            <div className="flex flex-2 gap-2 items-center">

                <div className="md:flex-1 ml-auto text-right">
                    <CommandMenu />
                </div>
                <div className="flex md:flex-1 gap-2 items-center justify-end">
                    <TaskSheet />
                    <NotificationsSheet />
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}