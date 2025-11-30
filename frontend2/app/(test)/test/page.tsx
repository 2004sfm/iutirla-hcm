import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Globe2 } from "lucide-react";

export default function CountryCard() {
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <Card className="relative w-[395px] h-[140px] flex flex-col justify-between p-5 overflow-hidden bg-linear-to-br from-blue-900 via-blue-700 to-blue-500 hover:scale-105 hover:contrast-125 hover:shadow-xl transition-all duration-300 ease-out group cursor-pointer text-white">

                <CardHeader className="p-0 text-2xl font-bold mb-1">
                    Paises
                </CardHeader>
                <CardContent className="p-0 text-sm font-medium mr-26">
                    Gestión de países para direcciones y funcionalidades
                </CardContent>

                <Globe2
                    strokeWidth={1}
                    className="absolute -right-6 -bottom-6 size-32 text-blue-200/90 group-hover:text-white/80 rotate-0 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-300 ease-in-out" />
            </Card>
        </div>
    );
}