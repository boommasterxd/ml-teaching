/**
 * utils.ts
 *
 * Shared utility functions used across the application.
 * Exports the `cn` helper for composing conditional Tailwind CSS class names.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and deduplicates Tailwind CSS class names.
 *
 * Accepts any number of class values (strings, arrays, objects) via `clsx`,
 * then resolves Tailwind conflicts with `twMerge` so that later classes
 * correctly override earlier ones (e.g. `p-2` overrides `p-4`).
 *
 * @param inputs - One or more class values to merge.
 * @returns A single deduplicated class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
