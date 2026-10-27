"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import type { DashboardMetricsDTO } from "@/types/financial";

export const DASHBOARD_METRICS_QUERY_KEY = ["dashboardMetrics"] as const;

interface UseDashboardMetricsOptions {
  initialData?: DashboardMetricsDTO;
}

export function useDashboardMetrics({ initialData }: UseDashboardMetricsOptions = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_METRICS_QUERY_KEY,
    queryFn: async () => {
      return getDashboardMetricsAction();
    },
    initialData,
    // Mantém fresco em cache por 1 hora (3.600.000 ms)
    staleTime: 1000 * 60 * 60,
  });

  const invalidateMetrics = () => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_METRICS_QUERY_KEY,
    });
  };

  return {
    ...query,
    metrics: query.data,
    invalidateMetrics,
  };
}
