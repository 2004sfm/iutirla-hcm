import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface ProfileHeaderProps {
    title?: string
}

export function EmployeeHeader({ title }: ProfileHeaderProps) {
    return (
        <header className="flex items-center h-10 border-b">
            <SidebarTrigger className="ml-2 [&_svg]:size-5!" />
            <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h2 className="text-xl font-medium truncate">{title}</h2>
        </header>
    )
}
