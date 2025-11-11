import "../globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body>
                <main>{children}</main>
            </body>
        </html>
    )
}