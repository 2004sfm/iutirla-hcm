import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Book, Download } from "lucide-react";

export function ManualButton() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Manual de Usuario" className="text-slate-600 hover:bg-slate-100 hover:text-slate-800">
                    <Book className="size-5" />
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-[90vw] lg:max-w-[80vw] flex flex-col h-full py-6 px-4">
                <SheetHeader className="pb-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <Book className="size-5 text-brand-primary" />
                            <span>Manual de Usuario</span>
                        </SheetTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            asChild
                        >
                            <a href="/manual de usuario.pdf" download>
                                <Download className="size-4 mr-2" />
                                Descargar PDF
                            </a>
                        </Button>
                    </div>
                    <SheetDescription className="text-sm text-muted-foreground pt-2">
                        Consulta el manual de usuario para aprender a utilizar todas las funcionalidades del sistema.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    <iframe
                        src="/manual de usuario.pdf"
                        className="w-full h-full rounded-lg border border-border"
                        title="Manual de Usuario PDF"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
