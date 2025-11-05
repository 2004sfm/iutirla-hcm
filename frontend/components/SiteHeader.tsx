import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { TaskSheet } from "./TaskSheet";
import { NotificationsSheet } from "./NotificationsSheet";
import { UserMenu } from "./UserMenu";

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
                        <div className="relative h-10 w-30 flex items-center font-montserrat text-2xl italic font-bold">

                            <span>IUTIRLA</span>
                            <span className="absolute top-0 font-semibold right-0 text-[10px]">HCM</span>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="w-full hidden md:flex md:grow md:basis-0 items-center justify-end">
                <Button
                    variant="outline"
                    className="hidden w-full justify-start text-muted-foreground md:flex"
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">Buscar</span>
                    {/* <Kbd>⌘ + K</Kbd> */}
                </Button>
            </div>

            <div className="flex flex-1 gap-2 items-center justify-end">
                <Button
                    variant={"ghost"}
                    size={"icon"}
                    className="md:hidden"
                >
                    <Search className="size-4.5" />
                </Button>
                <TaskSheet />

                <NotificationsSheet />
                <UserMenu />
            </div>
        </header>
    )
}