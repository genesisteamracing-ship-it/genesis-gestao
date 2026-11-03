"use client";

import * as React from "react";

interface SidebarContextValue {
  isOpen: boolean;
  isMobileOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "genesis_sidebar_open";

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") {
      return defaultOpen;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = React.useState<boolean>(false);

  const toggleSidebar = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsOpen((prev) => {
        const nextState = !prev;
        try {
          localStorage.setItem(STORAGE_KEY, String(nextState));
        } catch {
          // Ignora erro de escrita no localStorage
        }
        return nextState;
      });
    }
  }, []);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      isOpen,
      isMobileOpen,
      setIsOpen,
      setIsMobileOpen,
      toggleSidebar,
    }),
    [isOpen, isMobileOpen, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar deve ser utilizado dentro de um SidebarProvider");
  }
  return context;
}
