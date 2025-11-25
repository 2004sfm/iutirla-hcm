import { SiteHeader } from "@/components/SiteHeader";
import { SiteSidebar } from "@/components/SiteSidebar";
import { cn } from "@/lib/utils";
import { montserrat } from "@/lib/fonts";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(montserrat.variable, "h-dvh grid grid-cols-[var(--sidebar-width)_1fr] md:grid-rows-[var(--header-height)_1fr] grid-rows-[var(--header-height)_1fr_var(--sidebar-height)] overflow-hidden")}>

        <AuthProvider>
          <ProtectedRoute>
            {/* 1. HEADER GLOBAL */}
            <SiteHeader className="bg-background col-span-2 z-20" />

            {/* 2. SIDEBAR GLOBAL (YouTube Style) - SIEMPRE VISIBLE */}
            <SiteSidebar className="bg-background -row-end-1 md:col-span-1 col-span-2 z-10" />

            {/* 3. AREA DE CONTENIDO PRINCIPAL */}
            <main className="inset-shadow-sm md:col-span-1 col-span-2 z-0 overflow-hidden relative">
              {/* Aquí se renderizarán tanto las páginas normales como el AdminLayout */}
              {children}
            </main>

            <Toaster position="top-center" theme="light" richColors />
          </ProtectedRoute>
        </AuthProvider>

      </body>
    </html >
  );
}