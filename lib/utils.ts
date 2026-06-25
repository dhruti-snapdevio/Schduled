import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Never"
  }
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

/**
 * Compact page-number list with ellipsis for pagination UIs.
 * e.g. (4, 20) → [1, "ellipsis", 3, 4, 5, "ellipsis", 20]
 */
export function paginationRange(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const out: (number | "ellipsis")[] = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) out.push("ellipsis")
    out.push(p)
    prev = p
  }
  return out
}
