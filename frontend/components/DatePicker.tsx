"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronDownIcon } from "lucide-react" // Importamos ChevronDownIcon si lo deseas para el botón
import { es } from "date-fns/locale" // Importamos español para los nombres de meses/días

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
// Si usas Label en el componente, deberías importarlo también.
// import { Label } from "@/components/ui/label" 

interface DatePickerProps {
    selected?: Date | undefined
    onSelect?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({ selected, onSelect, placeholder = "Seleccione una fecha", className, disabled = false }: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (date: Date | undefined) => {
        if (onSelect) {
            onSelect(date)
        }
        setOpen(false) // Cierra el popover al seleccionar
    }

    return (
        // Opcional: Puedes envolverlo en un <div> si quieres añadir un Label como en el segundo ejemplo
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selected ? (
                        // Formato largo en español: "15 de noviembre de 2023"
                        // Aquí cambié a formato corto o el que prefieras, pero mantengo el español
                        format(selected, "dd/MM/yyyy", { locale: es })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                    {/* Opcional: Añadir el icono de flecha del segundo ejemplo */}
                    {/* <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" /> */}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    initialFocus
                    locale={es} // Traduce el calendario (Lunes, Martes...)
                    // ESTA ES LA PROP CLAVE para habilitar los desplegables de mes/año
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    )
}