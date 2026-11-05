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
 * Converte centavos inteiros (ex: 15050) em string formatada em Reais sem o símbolo de moeda (ex: "150,50" ou "1.500,00").
 * Se centavos for 0 ou inválido, retorna "0,00".
 */
export function formatCentsToReais(amountCents: number): string {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return "0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

/**
 * Converte string de valor em Reais (ex: "150,50", "1.500,00" ou "150.50") para centavos inteiros (15050).
 * Trata separadores de milhar (.) e decimais (,) corretamente.
 */
export function parseReaisToCents(reaisInput: string | number): number {
  if (typeof reaisInput === "number") {
    return Number.isFinite(reaisInput) ? Math.round(reaisInput * 100) : 0;
  }
  if (!reaisInput) return 0;

  const clean = reaisInput.toString().trim();
  if (!clean) return 0;

  // Se contiver vírgula (padrão brasileiro: "1.250,50" ou "450,00")
  if (clean.includes(",")) {
    // Remove todos os pontos de milhar e substitui a vírgula por ponto decimal
    const normalized = clean.replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // Se não contiver vírgula (ex: "1250.50" ou "450")
  const parsed = Number.parseFloat(clean);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Aplica a máscara monetária estilo ATM (começando dos centavos e deslocando casas à esquerda automaticamente).
 * Exemplos:
 * "" -> ""
 * "1" -> "0,01"
 * "12" -> "0,12"
 * "123" -> "1,23"
 * "1234" -> "12,34"
 * "123456" -> "1.234,56"
 * Apagar último dígito de "0,01" -> "" (campo limpo)
 */
export function formatCurrencyMask(value: string | number): string {
  if (value === null || value === undefined) return "";
  const rawStr = String(value).trim();
  if (rawStr === "") return "";

  // Extrai apenas os dígitos numéricos
  const digits = rawStr.replace(/\D/g, "");
  if (!digits) return "";

  // Limita a 12 dígitos para evitar overflow numérico
  const limitedDigits = digits.slice(-12);

  // Remove zeros à esquerda
  const unpadded = limitedDigits.replace(/^0+/, "");

  if (!unpadded) {
    // Se o usuário digitou exatamente um único "0", formata como "0,00"
    if (limitedDigits === "0") return "0,00";
    // Se sobrou apenas zeros (ex: apagou o '1' em '0,01' virando '0,0'), limpa o campo
    return "";
  }

  const cents = parseInt(unpadded, 10);
  if (Number.isNaN(cents) || cents === 0) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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
