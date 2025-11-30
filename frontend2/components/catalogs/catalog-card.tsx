import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface CatalogCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    gradient: string;
    iconColor: string;
}

export function CatalogCard({
    title,
    description,
    icon: Icon,
    href,
    gradient,
    iconColor,
}: CatalogCardProps) {
    return (
        <Link href={href}>
            <Card className={`relative h-[140px] flex flex-col p-5 overflow-hidden bg-linear-to-br ${gradient} hover:scale-105 hover:contrast-125 hover:shadow-xl transition-all duration-300 ease-out group cursor-pointer text-white border-0`}>
                <div className="h-full relative z-10 flex flex-col justify-between gap-1">
                    <CardHeader className="p-0 space-y-0">
                        <CardTitle className="mr-20 text-xl font-bold leading-tight">
                            {title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <CardDescription className="mr-26 text-white/90 text-sm font-medium line-clamp-2">
                            {description}
                        </CardDescription>
                    </CardContent>
                </div>

                <Icon
                    strokeWidth={1.5}
                    className={`absolute -right-6 -bottom-6 size-32 ${iconColor} -rotate-6 group-hover:rotate-6 group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-in-out`}
                />
            </Card>
        </Link>
    );
}
