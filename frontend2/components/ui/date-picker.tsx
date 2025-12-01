"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }
    return format(date, "dd/MM/yyyy")
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

export interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa", className }: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    // Sync input value when prop value changes
    React.useEffect(() => {
        setInputValue(formatDate(value))
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Allow only numbers and slashes
        val = val.replace(/[^0-9/]/g, '')

        // Auto-insert slashes
        if (val.length === 2 && inputValue.length === 1) {
            val += '/'
        } else if (val.length === 5 && inputValue.length === 4) {
            val += '/'
        }

        // Logic to cap values (Native-like behavior)
        const parts = val.split('/')

        // Cap Day > 31
        if (parts[0] && parseInt(parts[0]) > 31) {
            parts[0] = "31"
        }

        // Cap Month > 12
        if (parts[1] && parseInt(parts[1]) > 12) {
            parts[1] = "12"
        }

        // Cap Year > 2050
        if (parts[2] && parts[2].length === 4 && parseInt(parts[2]) > 2050) {
            parts[2] = "2050"
        }

        // Reconstruct value
        val = parts.join('/')

        // Limit length to 10 (DD/MM/YYYY)
        if (val.length > 10) {
            val = val.slice(0, 10)
        }

        setInputValue(val)

        // Try to parse the date from dd/MM/yyyy format
        if (val.length === 10) {
            const finalParts = val.split('/')
            if (finalParts.length === 3) {
                const day = parseInt(finalParts[0], 10)
                const month = parseInt(finalParts[1], 10) - 1
                const year = parseInt(finalParts[2], 10)

                const newDate = new Date(year, month, day)

                if (isValidDate(newDate) && newDate.getDate() === day && newDate.getMonth() === month && newDate.getFullYear() === year) {
                    onChange?.(newDate)
                } else {
                    onChange?.(undefined)
                }
            }
        } else if (val === "") {
            onChange?.(undefined)
        }
    }

    return (
        <div className={className}>
            <div className="relative flex gap-2">
                <Input
                    value={inputValue}
                    placeholder={placeholder}
                    className="bg-background text-sm pr-10"
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault()
                            setOpen(true)
                        }
                    }}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                        >
                            <CalendarIcon className="size-3.5" />
                            <span className="sr-only">Seleccionar fecha</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="end"
                        alignOffset={-8}
                        sideOffset={10}
                    >
                        <Calendar
                            mode="single"
                            selected={value}
                            captionLayout="dropdown"
                            // Default to today or selected date for month view
                            defaultMonth={value || new Date()}
                            onSelect={(date) => {
                                onChange?.(date)
                                setOpen(false)
                            }}
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
