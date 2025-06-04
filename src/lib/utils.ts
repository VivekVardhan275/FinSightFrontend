
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Currency } from "@/contexts/currency-context";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// amount is the ALREADY CONVERTED amount for the target currency
export function formatCurrency(amount: number, currency: Currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { // Consider making locale dynamic in future
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
