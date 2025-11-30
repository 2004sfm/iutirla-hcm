import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
    {
        id: 1,
        title: "Revisar nómina quincenal",
        status: "pending",
        priority: "high",
        dueDate: "Hoy, 5:00 PM"
    },
    {
        id: 2,
        title: "Aprobar vacaciones de J. Pérez",
        status: "in-progress",
        priority: "medium",
        dueDate: "Mañana, 10:00 AM"
    },
    {
        id: 3,
        title: "Actualizar manual de organización",
        status: "pending",
        priority: "low",
        dueDate: "Viernes, 12:00 PM"
    },
    {
        id: 4,
        title: "Entrevista con candidato Sr.",
        status: "completed",
        priority: "high",
        dueDate: "Ayer"
    }
];

export function TaskSheet() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Tareas" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    <CheckCircle className="size-5" />
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full py-6 px-4">
                <SheetHeader className="pb-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle className="size-5 text-brand-primary" />
                        <span>Lista de tareas</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-brand-primary/50 transition-all duration-200"
                            >
                                <div className={cn(
                                    "mt-1 size-2 rounded-full shrink-0",
                                    task.priority === "high" ? "bg-destructive" :
                                        task.priority === "medium" ? "bg-brand-tertiary" :
                                            "bg-brand-secondary"
                                )} />

                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "text-sm font-semibold text-foreground mb-1 group-hover:text-brand-primary transition-colors",
                                        task.status === "completed" && "line-through text-muted-foreground"
                                    )}>
                                        {task.title}
                                    </h4>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            <span>{task.dueDate}</span>
                                        </div>

                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                                            task.status === "pending" ? "bg-brand-tertiary/10 text-brand-tertiary" :
                                                task.status === "in-progress" ? "bg-brand-primary/10 text-brand-primary" :
                                                    "bg-brand-secondary/10 text-brand-secondary"
                                        )}>
                                            {task.status === "in-progress" ? "En curso" :
                                                task.status === "pending" ? "Pendiente" : "Completada"}
                                        </span>
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="size-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 mt-auto border-t border-border">
                    <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white">
                        Ver todas las tareas
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
