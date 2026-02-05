import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a user role has admin privileges (OWNER or ADMIN)
 */
export function isAdminRole(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}
