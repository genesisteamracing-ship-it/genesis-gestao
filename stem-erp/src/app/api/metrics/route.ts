import { NextResponse } from "next/server";
import { getDashboardMetricsService } from "@/services/financial-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getDashboardMetricsService();
    return NextResponse.json({
      ok: true,
      kpis: metrics.kpis,
      cashFlowMonthsCount: metrics.cashFlow.months.length,
      scheduleGroupsCount: metrics.schedule.length,
    });
  } catch (error) {
    console.error("[GET /api/metrics] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Falha ao consultar métricas no Neon Postgres" },
      { status: 500 }
    );
  }
}
