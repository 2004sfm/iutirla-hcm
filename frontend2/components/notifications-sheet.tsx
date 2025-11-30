import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
    {
        id: 1,
        title: "Solicitud aprobada",
        description: "Tu solicitud de vacaciones ha sido aprobada por RRHH.",
        time: "Hace 5 min",
        read: false,
        type: "success"
    },
    {
        id: 2,
        title: "Recordatorio de reunión",
        description: "Reunión de equipo en 15 minutos en la sala de conferencias.",
        time: "Hace 15 min",
        read: false,
        type: "info"
    },
    {
        id: 3,
        title: "Actualización del sistema",
        description: "El sistema estará en mantenimiento este sábado a las 10 PM.",
        time: "Hace 2 horas",
        read: true,
        type: "warning"
    },
    {
        id: 4,
        title: "Error en carga de archivo",
        description: "El archivo 'reporte_mensual.pdf' no se pudo procesar.",
        time: "Ayer",
        read: true,
        type: "error"
    }
];

export function NotificationsSheet() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificaciones" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground relative">
                    <Bell className="size-5" />
                    <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border-2 border-primary" />
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full py-6 px-4">
                <SheetHeader className="pb-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <Bell className="size-5 text-brand-primary" />
                            <span>Notificaciones</span>
                        </SheetTitle>
                        {/* <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-brand-primary">
                            Marcar todo como leído
                        </Button> */}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "flex gap-4 p-4 rounded-xl transition-colors cursor-pointer",
                                    notification.read ? "hover:bg-muted/50" : "bg-brand-primary/5 hover:bg-brand-primary/10"
                                )}
                            >
                                <div className={cn(
                                    "mt-1 size-8 rounded-full flex items-center justify-center shrink-0",
                                    notification.type === "success" ? "bg-green-100 text-green-600" :
                                        notification.type === "warning" ? "bg-yellow-100 text-yellow-600" :
                                            notification.type === "error" ? "bg-red-100 text-red-600" :
                                                "bg-blue-100 text-blue-600"
                                )}>
                                    {notification.type === "success" && <CheckCircle2 className="size-4" />}
                                    {notification.type === "warning" && <AlertTriangle className="size-4" />}
                                    {notification.type === "error" && <XCircle className="size-4" />}
                                    {notification.type === "info" && <Info className="size-4" />}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start --justify-between gap-2">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "text-brand-primary")}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {notification.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {notification.description}
                                    </p>
                                </div>

                                {!notification.read && (
                                    <div className="mt-2 size-2 bg-brand-primary rounded-full shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-brand-primary">
                        Marcar todo como leído
                    </Button>
                    <div className="w-full pt-4 mt-auto border-t border-border">
                        <Button variant="outline" className="w-full">
                            Ver historial completo
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
