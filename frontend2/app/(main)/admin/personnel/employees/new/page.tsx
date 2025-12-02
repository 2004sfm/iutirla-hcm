"use client";

import { EmploymentForm } from "@/components/personnel/EmploymentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewEmployeePage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nuevo Empleado</h1>
                    <p className="text-muted-foreground">Registra un nuevo empleado en el sistema</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>

            <EmploymentForm />
        </div>
    );
}
