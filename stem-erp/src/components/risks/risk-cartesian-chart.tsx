"use client";

import * as React from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { tv } from "tailwind-variants";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_ENTRY_TYPE_LABELS,
  RISK_PRIORITY_LABELS,
  RISK_PROBABILITY_LABELS,
} from "@/lib/risk-matrix";
import type { CartesianPoint } from "@/types/risks";

interface RiskCartesianChartProps {
  points: CartesianPoint[];
  onSelectRisk?: (riskId: string) => void;
}

const cartesianStyles = tv({
  slots: {
    card: "rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs min-w-0",
    header:
      "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
    title: "text-sm font-semibold text-foreground",
    legendRow: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
    legendItem: "inline-flex items-center gap-1.5",
    dot: "h-2.5 w-2.5 rounded-full shrink-0",
    chartWrap: "mt-3 h-80 w-full min-w-0",
    empty:
      "flex h-72 items-center justify-center text-xs text-muted-foreground",
  },
});

const X_TICKS = [0, 1, 2, 3, 4, 5];
const Y_TICKS = [0, 1, 2, 3, 4, 5];

const X_LABELS: Record<number, string> = {
  0: "None",
  1: "Desprezível",
  2: "Pequena",
  3: "Moderada",
  4: "Grande",
  5: "Catastrófica",
};

const Y_LABELS: Record<number, string> = {
  0: "None",
  1: "Rara",
  2: "Improvável",
  3: "Possível",
  4: "Provável",
  5: "Quase certo",
};

function getPointColor(point: CartesianPoint): string {
  if (point.entryType === "OPPORTUNITY") return "var(--success)";
  switch (point.priorityLevel) {
    case "CRITICAL":
      return "var(--destructive)";
    case "HIGH":
      return "var(--warning)";
    case "MEDIUM":
      return "var(--primary)";
    case "LOW":
      return "var(--success)";
    default:
      return "var(--muted-foreground)";
  }
}

export function RiskCartesianChart({
  points,
  onSelectRisk,
}: RiskCartesianChartProps) {
  const styles = cartesianStyles();

  return (
    <section
      className={styles.card()}
      aria-label="Plano Cartesiano de Riscos (Probabilidade por Consequência)"
    >
      <div className={styles.header()}>
        <h2 className={styles.title()}>
          Plano Cartesiano (Chance × Consequência)
        </h2>
        <div className={styles.legendRow()}>
          <span className={styles.legendItem()}>
            <span
              className={styles.dot()}
              style={{ backgroundColor: "var(--destructive)" }}
            />
            Crítico
          </span>
          <span className={styles.legendItem()}>
            <span
              className={styles.dot()}
              style={{ backgroundColor: "var(--warning)" }}
            />
            Alto
          </span>
          <span className={styles.legendItem()}>
            <span
              className={styles.dot()}
              style={{ backgroundColor: "var(--primary)" }}
            />
            Médio
          </span>
          <span className={styles.legendItem()}>
            <span
              className={styles.dot()}
              style={{ backgroundColor: "var(--success)" }}
            />
            Baixo / Oportunidade
          </span>
          <span className={styles.legendItem()}>
            <span
              className={styles.dot()}
              style={{ backgroundColor: "var(--muted-foreground)" }}
            />
            None
          </span>
        </div>
      </div>

      {points.length === 0 ? (
        <div className={styles.empty()}>
          Nenhum risco ou oportunidade para plotar no plano cartesiano.
        </div>
      ) : (
        <div className={styles.chartWrap()}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.7}
              />
              <ReferenceArea
                x1={3.5}
                x2={5.5}
                y1={3.5}
                y2={5.5}
                fill="var(--destructive)"
                fillOpacity={0.07}
              />
              <ReferenceArea
                x1={2.5}
                x2={5.5}
                y1={2.5}
                y2={5.5}
                fill="var(--warning)"
                fillOpacity={0.04}
              />
              <XAxis
                type="number"
                dataKey="x"
                name="Consequência"
                domain={[-0.4, 5.4]}
                ticks={X_TICKS}
                tickFormatter={(v) => X_LABELS[Number(v)] ?? ""}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Probabilidade"
                domain={[-0.4, 5.4]}
                ticks={Y_TICKS}
                tickFormatter={(v) => Y_LABELS[Number(v)] ?? ""}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                width={84}
                stroke="var(--border)"
              />
              <ZAxis type="number" dataKey="z" range={[110, 240]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as CartesianPoint | undefined;
                  if (!point) return null;
                  return (
                    <div className="max-w-xs rounded-xl border border-border bg-card p-3 text-xs shadow-md">
                      <p className="font-semibold text-foreground">
                        {point.title}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {RISK_ENTRY_TYPE_LABELS[point.entryType]} ·{" "}
                        {DELIVERY_GROUP_SHORT_LABELS[point.sector]}
                      </p>
                      <p className="mt-1 text-foreground">
                        Chance: {RISK_PROBABILITY_LABELS[point.probability]} |{" "}
                        Consequência:{" "}
                        {RISK_CONSEQUENCE_LABELS[point.consequence]}
                      </p>
                      <p className="mt-0.5 font-medium text-muted-foreground">
                        Prioridade: {RISK_PRIORITY_LABELS[point.priorityLevel]}
                        {point.groupCount > 1
                          ? ` (${point.groupCount} itens nesta coordenada)`
                          : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter
                name="Riscos"
                data={points}
                onClick={(entry) => {
                  const id = (entry as unknown as CartesianPoint | undefined)
                    ?.id;
                  if (id && onSelectRisk) onSelectRisk(id);
                }}
              >
                {points.map((point) => (
                  <Cell
                    key={point.id}
                    fill={getPointColor(point)}
                    fillOpacity={0.9}
                    stroke="var(--card)"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
