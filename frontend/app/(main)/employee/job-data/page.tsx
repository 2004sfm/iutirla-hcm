import { EmployeeHeader } from "@/components/EmployeeHeader";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Profile() {
    return (
        <>
            <EmployeeHeader title="Datos del Puesto" />
            <ScrollArea className="flex-1 overflow-y-auto">
                lorem*1000
            </ScrollArea>
        </>
    )
}