import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Bell } from "lucide-react";

export function NotificationsSheet() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificaciones">
                    <Bell className="size-4.5" />
                </Button>
            </SheetTrigger>

            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Bell className="size-4.5" />
                        <span>Notificaciones</span>
                    </SheetTitle>
                    <SheetDescription>
                        Aquí tienes tus notificaciones más recientes.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <p>Notificación 1...</p>
                    <p>Notificación 2...</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}