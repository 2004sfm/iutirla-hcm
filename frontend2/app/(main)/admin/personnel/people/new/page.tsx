"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PersonForm } from "@/components/personnel/PersonForm";

export default function NewPersonPage() {
    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            <div className="flex items-center justify-between border-b pb-6">
                <h1 className="text-2xl font-bold tracking-tight">Nueva Persona</h1>
                <Button variant="outline" asChild>
                    <Link href="/admin/personnel/people">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>

            <PersonForm />
        </div>
    );
}
