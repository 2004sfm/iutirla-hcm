import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { CommandMenu } from "@/components/command-menu";
import { TaskSheet } from "@/components/task-sheet";
import { NotificationsSheet } from "@/components/notifications-sheet";
import { UserMenu } from "@/components/user-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

interface HeaderProps {
    onToggleSidebar: () => void;
    collapsed: boolean;
}

export function Header({ onToggleSidebar, collapsed }: HeaderProps) {
    return (
        <header
            className={cn(
                "fixed top-0 right-0 h-14 bg-white border-b border-border transition-all duration-300 z-30 flex items-center justify-between px-4 shadow-sm",
                "left-0", // Mobile default
                collapsed ? "md:left-16" : "md:left-64" // Desktop overrides
            )}
        >
            {/* Left Section */}
            <div className="flex items-center gap-4">
                {/* Mobile Sidebar Trigger */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button
                            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 border-r-0">
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
                        <SidebarContent collapsed={false} />
                    </SheetContent>
                </Sheet>

                {/* Desktop Sidebar Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden md:block p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Right Section */}
            <div className="ml-auto flex items-center gap-2">
                <div className="flex md:flex-1 gap-2 items-center justify-end">
                    <CommandMenu />
                    {/* <TaskSheet /> */}
                    <NotificationsSheet />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
