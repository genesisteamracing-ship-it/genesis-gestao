"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_METRICS_QUERY_KEY } from "@/hooks/use-dashboard-metrics";

/**
 * Hook para invalidar o cache de métricas do TanStack Query
 * chamado ao adicionar, editar ou excluir qualquer recurso, transação ou equipe.
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_METRICS_QUERY_KEY,
    });
  };
}
