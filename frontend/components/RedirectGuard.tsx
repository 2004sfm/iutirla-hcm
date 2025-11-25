// components/RedirectGuard.tsx (NUEVO ARCHIVO)
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RedirectGuardProps {
    targetPath: string;
}

// Este componente solo existe para disparar el redirect y no renderizar nada
export default function RedirectGuard({ targetPath }: RedirectGuardProps) {
    const router = useRouter();

    useEffect(() => {
        router.replace(targetPath);
    }, [router, targetPath]);

    // Retornamos un loader MINIMALISTA que no tiene layout complejo
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    );
}