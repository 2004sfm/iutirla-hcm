import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBackendDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;
  // Dividimos manualmente: "2025-11-23" -> [2025, 11, 23]
  const [year, month, day] = dateString.split('-').map(Number);
  // Creamos la fecha local: Año, Mes (0-11), Día
  return new Date(year, month - 1, day);
}
