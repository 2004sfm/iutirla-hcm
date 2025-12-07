"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

interface Department {
    id: number;
    name: string;
    manager: {
        name: string;
        position: string;
    } | null;
}

interface DepartmentCardProps {
    department: Department;
    href?: string;
}

export function DepartmentCard({ department, href }: DepartmentCardProps) {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);

    const coverImageSrc = !imageError
        ? "/images/department-placeholder.webp"
        : "/images/department-placeholder.webp";

    const handleClick = () => {
        if (href) {
            router.push(href);
        }
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col p-0">
            {/* Cover Image */}
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={coverImageSrc}
                    alt={department.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                />
            </div>

            <CardContent className="flex-1 flex flex-col gap-4 p-4">
                {/* Department Name */}
                <h3 className="text-lg font-semibold line-clamp-2">
                    {department.name}
                </h3>

                {/* Manager Info */}
                <div className="flex flex-col border-t pt-4">
                    <div className="flex items-start gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Gerente</p>
                            {department.manager ? (
                                <div>
                                    <p className="font-medium truncate">{department.manager.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {department.manager.position.split(" - ")[0]}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">Sin gerente asignado</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button onClick={handleClick} variant="outline" className="w-full">
                    Ver Departamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
