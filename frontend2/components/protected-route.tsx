"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthLoading } from "./auth-loading";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            let targetPath = null;

            if (!user) {
                targetPath = `/login?returnUrl=${encodeURIComponent(pathname)}`;
            } else if (requireAdmin && !user.is_staff) {
                targetPath = '/';
            }

            if (targetPath) {
                router.replace(targetPath);
            }
        }
    }, [user, isLoading, requireAdmin, router, pathname]);

    const isAuthenticated = user && (!requireAdmin || user.is_staff);

    if (isLoading || !isAuthenticated) {
        // Reuse the AuthLoading component for consistency, or just show nothing while redirecting
        // Since AuthLoading handles isLoading internally, we can use it here if we want the skeleton
        // But here we might want to block rendering until we are sure.
        // If !isAuthenticated and !isLoading, we are redirecting, so showing a loader or skeleton is fine.
        return (
            <AuthLoading>
                <div />
            </AuthLoading>
        );
    }

    return <>{children}</>;
}
