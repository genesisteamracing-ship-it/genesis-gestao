import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Converte um valor em centavos (integer) para moeda BRL formatada (Ex: 15000 -> "R$ 150,00")
 */
export function formatCurrencyFromCents(amountCents: number): string {
  const valueInReais = amountCents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInReais);
}

/**
 * Converte string de valor em Reais (ex: "150,50" ou "150.50") para centavos inteiros (15050)
 */
export function parseReaisToCents(reaisInput: string | number): number {
  if (typeof reaisInput === "number") {
    return Math.round(reaisInput * 100);
  }
  const normalized = reaisInput.replace(/[^\d,.-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Formata uma data ISO ou Date para o padrão brasileiro DD/MM/AAAA
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
