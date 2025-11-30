import Image from "next/image";
import { cn } from "@/lib/utils";

interface IutirlaLogoProps {
    collapsed?: boolean;
    className?: string;
}

export function IutirlaLogo({ collapsed, className }: IutirlaLogoProps) {
    return (
        <div className={cn("flex items-center gap-1 cursor-pointer", className)}>
            <div className={cn("flex items-center justify-center shrink-0", collapsed ? "w-16 h-14" : "ml-3 h-14")}>
                <Image
                    src="/images/logoiutirla.webp"
                    alt="Logo de IUTIRLA"
                    width={256}
                    height={351}
                    className="h-10 w-auto"
                />
            </div>
            {!collapsed && (
                <div className="relative h-10 flex items-center font-montserrat text-2xl italic font-bold animate-in fade-in duration-300 whitespace-nowrap">
                    <span>IUTIRLA</span>
                    <span className="absolute top-0 font-semibold -right-4 text-[8px]">HCM</span>
                </div>
            )}
        </div>
    )
}
