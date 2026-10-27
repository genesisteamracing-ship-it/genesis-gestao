"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache por 1 hora conforme solicitado (3.600.000 ms)
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2, // 2 horas de garbage collection
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Servidor: sempre crie um novo client para evitar vazamento de dados entre requisições
    return makeQueryClient();
  } else {
    // Navegador: crie uma única vez e reutilize
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
