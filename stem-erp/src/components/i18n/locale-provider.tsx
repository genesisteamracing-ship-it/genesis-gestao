"use client";

import * as React from "react";
import { DomTextTranslator } from "@/lib/i18n/dom-translator";
import {
  DEFAULT_LOCALE,
  getStoredLocale,
  LOCALE_STORAGE_KEY,
  persistLocale,
  type AppLocale,
} from "@/lib/i18n/locale-types";
import { translateUiText } from "@/lib/i18n/translations";

export interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  isEnglish: boolean;
  isPortuguese: boolean;
  t: (ptText: string) => string;
}

const DEFAULT_LOCALE_CONTEXT: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  isEnglish: false,
  isPortuguese: true,
  t: (ptText: string) => ptText,
};

const LocaleContext = React.createContext<LocaleContextValue>(
  DEFAULT_LOCALE_CONTEXT
);

const localeListeners = new Set<() => void>();

function subscribeLocaleStore(callback: () => void): () => void {
  localeListeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LOCALE_STORAGE_KEY) {
      callback();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    localeListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function notifyLocaleStoreListeners(): void {
  for (const listener of localeListeners) {
    listener();
  }
}

function getClientLocaleSnapshot(): AppLocale {
  return getStoredLocale();
}

function getServerLocaleSnapshot(): AppLocale {
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = React.useSyncExternalStore(
    subscribeLocaleStore,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot
  );
  const translatorRef = React.useRef<DomTextTranslator | null>(null);

  React.useEffect(() => {
    persistLocale(locale);

    if (!translatorRef.current) {
      translatorRef.current = new DomTextTranslator();
    }

    if (locale === "en-US") {
      translatorRef.current.start(document.body);
    } else {
      translatorRef.current.stopAndRestore();
    }
  }, [locale]);

  React.useEffect(() => {
    return () => {
      translatorRef.current?.stopAndRestore();
    };
  }, []);

  const setLocale = React.useCallback((next: AppLocale) => {
    const current = getStoredLocale();
    persistLocale(next);
    if (current !== next) {
      notifyLocaleStoreListeners();
    }
  }, []);

  const t = React.useCallback(
    (ptText: string) => translateUiText(ptText, locale),
    [locale]
  );

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      isEnglish: locale === "en-US",
      isPortuguese: locale === "pt-BR",
      t,
    }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return React.useContext(LocaleContext);
}
