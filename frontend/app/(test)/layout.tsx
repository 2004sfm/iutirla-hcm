import React from 'react';
import "../globals.css";

export default function TestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <title>Mi Página de Prueba (Aislada)</title>
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}