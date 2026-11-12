"use client";

import * as React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { tv } from "tailwind-variants";
import type { DistributionSlice } from "@/types/risks";

interface RiskDistributionChartsProps {
  probabilityData: DistributionSlice[];
  consequenceData: DistributionSlice[];
}

const cardStyles = tv({
  slots: {
    grid: "grid grid-cols-1 gap-4 lg:grid-cols-2",
    card: "rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs min-w-0",
    title: "text-sm font-semibold text-foreground",
    chartWrap: "mt-3 h-64 w-full min-w-0",
    empty:
      "flex h-64 items-center justify-center text-xs text-muted-foreground",
  },
});

const TONE_COLOR_MAP: Record<DistributionSlice["tone"], string> = {
  critical: "var(--destructive)",
  high: "var(--warning)",
  medium: "var(--primary)",
  info: "var(--chart-2, var(--primary))",
  low: "var(--success)",
  muted: "var(--muted-foreground)",
};

function DistributionPieCard({
  title,
  slices,
}: {
  title: string;
  slices: DistributionSlice[];
}) {
  const styles = cardStyles();
  const nonZero = React.useMemo(
    () => slices.filter((s) => s.count > 0),
    [slices]
  );

  return (
    <section className={styles.card()} aria-label={title}>
      <h2 className={styles.title()}>{title}</h2>
      {nonZero.length === 0 ? (
        <div className={styles.empty()}>Sem registros para exibir.</div>
      ) : (
        <div className={styles.chartWrap()}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nonZero}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="48%"
                innerRadius={44}
                outerRadius={78}
                paddingAngle={2}
              >
                {nonZero.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={TONE_COLOR_MAP[entry.tone]}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const payload = item?.payload as DistributionSlice | undefined;
                  return [
                    `${value ?? 0} (${payload?.percentage ?? 0}%)`,
                    payload?.label ?? "",
                  ];
                }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={42}
                formatter={(value, entry) => {
                  const payload = entry?.payload as DistributionSlice | undefined;
                  return (
                    <span className="text-xs text-foreground">
                      {value} ({payload?.percentage ?? 0}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function RiskDistributionCharts({
  probabilityData,
  consequenceData,
}: RiskDistributionChartsProps) {
  const styles = cardStyles();

  return (
    <div className={styles.grid()}>
      <DistributionPieCard
        title="Distribuição por Chance (%)"
        slices={probabilityData}
      />
      <DistributionPieCard
        title="Distribuição por Consequência (%)"
        slices={consequenceData}
      />
    </div>
  );
}
