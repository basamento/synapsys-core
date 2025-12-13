import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return (
    `${pad(d.getDate())}:` +
    `${pad(d.getMonth() + 1)}:` +
    `${d.getFullYear()} ` +
    `${pad(d.getHours())}:` +
    `${pad(d.getMinutes())}:` +
    `${pad(d.getSeconds())}`
  )
}

