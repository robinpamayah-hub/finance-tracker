import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyExact(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getDTIColor(dti: number): string {
  if (dti < 36) return "text-emerald-500";
  if (dti <= 50) return "text-yellow-500";
  return "text-red-500";
}

export function getDTIBgColor(dti: number): string {
  if (dti < 36) return "bg-emerald-500";
  if (dti <= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function getDTILabel(dti: number): string {
  if (dti < 36) return "Healthy";
  if (dti <= 50) return "Moderate";
  return "High Risk";
}
