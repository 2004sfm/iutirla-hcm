import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { TaskSheet } from "./TaskSheet";
import { NotificationsSheet } from "./NotificationsSheet";
import { UserMenu } from "./UserMenu";
import { CommandMenu } from "./CommandMenu";
import { Kbd } from "@/components/ui/kbd";

interface SiteHeaderProps {
    className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
    return (
        <header className={cn("border-b shadow-sm flex px-2 md:px-4", className)}>
            <div className="h-full flex md:flex-1 items-center"> {/* shrink-0 */}
                <Link href="/" aria-label="Volver a la página de inicio">
                    <div className="flex items-center gap-1">
                        <Image
                            src="/logoiutirla.png"
                            alt="Logo de IUTIRLA"
                            width={256}
                            height={351}
                            className="h-10 w-auto"
                        />
                        {/* <div className="relative h-10 w-27 flex items-center text-2xl italic font-bold"> */}
                        <div className="relative h-10 flex items-center font-montserrat text-2xl italic font-bold">

                            <span>IUTIRLA</span>
                            <span className="absolute top-0 font-semibold -right-4 text-[8px]">HCM</span>
                        </div>
                    </div>
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