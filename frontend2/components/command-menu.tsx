"use client"
import React, { useState } from "react";
import { Search } from "lucide-react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd"

import { commandSections } from "@/lib/command-menu-data"
import { Button } from "@/components/ui/button";

export function CommandMenu() {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button
                variant={"ghost"}
                size={"icon"}
                className="md:hidden"
                onClick={() => (setOpen(true))}
            >
                <Search className="size-4.5" />
            </Button>

            <Button
                variant="outline"
                onClick={() => (setOpen(true))}
                className="hidden w-90 justify-start text-slate-600 md:flex border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-800"
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Buscar</span>
            </Button>


            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Buscar" />
                <CommandList>
                    <CommandEmpty>Resultados no encontrados</CommandEmpty>
                    {commandSections.map((section, index) => (
                        <React.Fragment key={section.heading}>
                            {index > 0 && <CommandSeparator />}
                            <CommandGroup heading={section.heading}>
                                {section.items.map(item => {
                                    return (
                                        <CommandItem key={item.name} onSelect={() => setOpen(!open)}>
                                            <item.icon />
                                            <span>{item.name}</span>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </React.Fragment>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    );
}
