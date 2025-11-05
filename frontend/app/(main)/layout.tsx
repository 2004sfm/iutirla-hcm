import { SiteHeader } from "@/components/SiteHeader";
import { SiteSidebar } from "@/components/SiteSidebar";
import { cn } from "@/lib/utils";
import { montserrat } from "@/lib/fonts";
import "../globals.css";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(montserrat.variable, "h-dvh grid grid-cols-[var(--sidebar-width)_1fr] md:grid-rows-[var(--header-height)_1fr] grid-rows-[var(--header-height)_1fr_var(--sidebar-height)] overflow-hidden")}>

        <SiteHeader className="bg-background col-span-2 z-20" />
        <SiteSidebar className="bg-background -row-end-1 md:col-span-1 col-span-2 z-10" />
        <main className="inset-shadow-sm md:col-span-1 col-span-2 z-0 overflow-hidden">
          {children}
        </main>
      </body>
    </html >
  );
}
