import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBackendDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;

  // Dividimos manualmente: "2025-11-23" -> [2025, 11, 23]
  const [year, month, day] = dateString.split('-').map(Number);

  // Creamos la fecha local: Año, Mes (JavaScript cuenta meses de 0 a 11), Día
  // Esto crea "23 Nov 00:00:00" HORA VENEZUELA, no hora Londres.
  return new Date(year, month - 1, day);
}