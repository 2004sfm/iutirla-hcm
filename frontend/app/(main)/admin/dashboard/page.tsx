'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminHeader } from "@/components/AdminHeader";

export default function AdminDashboardPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return; // Detener ejecución
        }

        if (user && !user.is_staff) {
            router.push('/');
        }

    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div>Cargando...</div>;
    }

    return (
        <>
            {/* <AdminHeader  /> */}
            <ScrollArea className="flex-1 overflow-y-auto">
                lorem*1000
            </ScrollArea>
        </>

    );
}