/**
 * Shared utility functions used across the application.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges conditional class names with Tailwind CSS conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
