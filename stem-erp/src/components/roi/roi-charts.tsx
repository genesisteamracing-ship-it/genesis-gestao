"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SponsorTier } from "@prisma/client";
import { SPONSOR_TIER_LABELS } from "@/lib/constants";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { SponsorRoiSummaryDTO } from "@/types/financial";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RoiChartsProps {
  sponsors: SponsorRoiSummaryDTO[];
}

const TIER_COLORS: Record<SponsorTier, string> = {
  DIAMOND: "var(--primary)",
  GOLD: "var(--warning)",
  SILVER: "var(--muted-foreground)",
  BRONZE: "var(--destructive)",
};

export function RoiCharts({ sponsors }: RoiChartsProps) {
  // Dados do Gráfico 1: Investimento vs Retorno por Empresa
  const companyChartData = React.useMemo(() => {
    return sponsors.map((s) => ({
      name: s.name,
      Investimento: s.investedCents / 100,
      Retorno: s.deliveredReturnCents / 100,
      roi: s.roiPercent,
    }));
  }, [sponsors]);

  // Dados do Gráfico 2: Distribuição por Cota
  const tierChartData = React.useMemo(() => {
    const map: Record<SponsorTier, { tier: SponsorTier; investedCents: number; returnCents: number; count: number }> = {
      DIAMOND: { tier: "DIAMOND", investedCents: 0, returnCents: 0, count: 0 },
      GOLD: { tier: "GOLD", investedCents: 0, returnCents: 0, count: 0 },
      SILVER: { tier: "SILVER", investedCents: 0, returnCents: 0, count: 0 },
      BRONZE: { tier: "BRONZE", investedCents: 0, returnCents: 0, count: 0 },
    };

    for (const s of sponsors) {
      map[s.tier].investedCents += s.investedCents;
      map[s.tier].returnCents += s.deliveredReturnCents;
      map[s.tier].count += 1;
    }

    return Object.values(map)
      .filter((item) => item.investedCents > 0 || item.returnCents > 0 || item.count > 0)
      .map((item) => ({
        name: SPONSOR_TIER_LABELS[item.tier],
        tier: item.tier,
        Investimento: item.investedCents / 100,
        Retorno: item.returnCents / 100,
        empresas: item.count,
      }));
  }, [sponsors]);

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Gráfico 1: Comparativo Investimento vs Retorno por Empresa */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs lg:col-span-7">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base font-bold">
            Investimento vs. Retorno por Patrocinador
          </CardTitle>
          <CardDescription className="text-xs">
            Comparativo entre o valor investido pela empresa (lançamentos) e o
            retorno entregue pela equipe (ações)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="h-64 sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companyChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown) => [
                    formatCurrencyFromCents(Math.round(Number(val ?? 0) * 100)),
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                />
                <Bar
                  dataKey="Investimento"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  name="Investimento da Marca"
                />
                <Bar
                  dataKey="Retorno"
                  fill="var(--success)"
                  radius={[4, 4, 0, 0]}
                  name="Retorno Entregue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 2: Desempenho por Cota de Patrocínio */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs lg:col-span-5">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base font-bold">
            Distribuição por Cota de Patrocínio
          </CardTitle>
          <CardDescription className="text-xs">
            Volume captado e retorno gerado entre as cotas Bronze, Prata, Ouro e
            Diamante
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="h-64 sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tierChartData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown) => [
                    formatCurrencyFromCents(Math.round(Number(val ?? 0) * 100)),
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                />
                <Bar
                  dataKey="Investimento"
                  fill="var(--primary)"
                  radius={[0, 4, 4, 0]}
                  name="Investimento"
                />
                <Bar
                  dataKey="Retorno"
                  fill="var(--success)"
                  radius={[0, 4, 4, 0]}
                  name="Retorno Entregue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
