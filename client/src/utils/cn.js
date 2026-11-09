import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility to merge Tailwind classes cleanly
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

