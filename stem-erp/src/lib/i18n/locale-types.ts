export type AppLocale = "pt-BR" | "en-US";

export const DEFAULT_LOCALE: AppLocale = "pt-BR";
export const LOCALE_STORAGE_KEY = "stem-erp-locale";
export const LOCALE_COOKIE_NAME = "stem-erp-locale";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isValidLocale(value: unknown): value is AppLocale {
  return value === "pt-BR" || value === "en-US";
}

export function getStoredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isValidLocale(stored)) {
      return stored;
    }
  } catch {
    return DEFAULT_LOCALE;
  }

  try {
    const cookiePrefix = `${LOCALE_COOKIE_NAME}=`;
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(cookiePrefix));
    if (match) {
      const value = decodeURIComponent(match.slice(cookiePrefix.length));
      if (isValidLocale(value)) {
        return value;
      }
    }
  } catch {
    return DEFAULT_LOCALE;
  }

  return DEFAULT_LOCALE;
}

export function persistLocale(locale: AppLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignora falhas de armazenamento em modos privados restritos
  }

  try {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(
      locale
    )}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  } catch {
    // Ignora falhas de cookie em ambientes sem suporte
  }

  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.lang = locale;
  }
}
