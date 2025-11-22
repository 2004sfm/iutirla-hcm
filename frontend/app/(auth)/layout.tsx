import { AuthProvider } from "@/context/AuthContext";
import "../globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body>
                <AuthProvider>
                    <main>{children}</main>
                </AuthProvider>
            </body>
        </html>
    )
}