import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,25,000 style formatting (Indian digit grouping). */
export function formatINR(value: number): string {
  return `₹${inr.format(Math.round(value))}`;
}

export function formatNumberIN(value: number): string {
  return inr.format(value);
}
