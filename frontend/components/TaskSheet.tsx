import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { CheckCircle } from "lucide-react";

export function TaskSheet() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificaciones">
                    <CheckCircle className="size-4.5" />
                </Button>
            </SheetTrigger>

            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <CheckCircle className="size-4.5" />
                        <span>Lista de tareas</span>
                    </SheetTitle>
                    <SheetDescription>
                        Lista de tareas pendientes.
                    </SheetDescription>
                </SheetHeader>
                <div className="">
                    <p>Tarea 1</p>
                    <p>Tarea 2</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}