"use client";

import { AuthProvider } from "@/context/auth-context";
import { AuthLoading } from "@/components/auth-loading";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthLoading>
                {children}
                <Toaster position="top-center" theme="light" richColors />
            </AuthLoading>
        </AuthProvider>
    );
}
