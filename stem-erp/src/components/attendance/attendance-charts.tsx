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
import type { AttendanceAnalyticsDTO } from "@/types/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceChartCardStyles } from "./attendance-styles";

interface AttendanceChartsProps {
  analytics: AttendanceAnalyticsDTO;
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: "0.75rem",
  color: "var(--foreground)",
  fontSize: "12px",
};

export function AttendanceCharts({ analytics }: AttendanceChartsProps) {
  const styles = attendanceChartCardStyles();

  const proportionData = React.useMemo(
    () =>
      [
        {
          key: "present",
          label: "Presenças",
          value: analytics.totalPresences,
          color: "var(--success)",
        },
        {
          key: "absent",
          label: "Faltas",
          value: analytics.totalAbsences,
          color: "var(--destructive)",
        },
      ].filter((item) => item.value > 0),
    [analytics.totalAbsences, analytics.totalPresences]
  );

  const memberChartData = React.useMemo(
    () =>
      analytics.memberSummaries.map((member) => ({
        name: member.userName.split(" ").slice(0, 2).join(" "),
        Presenças: member.presencesCount,
        Faltas: member.absencesCount,
      })),
    [analytics.memberSummaries]
  );

  const sectorChartData = React.useMemo(
    () =>
      analytics.sectorBreakdown.map((sector) => ({
        sector: sector.sectorLabel,
        Frequência: sector.attendanceRate,
      })),
    [analytics.sectorBreakdown]
  );

  const memberChartHeight = Math.max(220, memberChartData.length * 36);

  return (
    <section aria-label="Dashboards de Presença nos Treinos" className="space-y-4">
      <div className={styles.row()}>
        <Card className={`${styles.card()} lg:col-span-8`}>
          <CardHeader className={styles.header()}>
            <CardTitle className={styles.title()}>
              Presenças e Faltas por Treino
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.body()}>
            {analytics.dailySeries.length === 0 ? (
              <div className={styles.empty()}>Sem treinos para exibir.</div>
            ) : (
              <div className={styles.chartWrap()}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.dailySeries}
                    margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="dateLabel"
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(_label, payload) => {
                        const point = payload?.[0]?.payload as
                          | { fullDateLabel?: string }
                          | undefined;
                        return point?.fullDateLabel ?? String(_label ?? "");
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Bar
                      dataKey="presences"
                      name="Presenças"
                      fill="var(--success)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="absences"
                      name="Faltas"
                      fill="var(--destructive)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`${styles.card()} lg:col-span-4`}>
          <CardHeader className={styles.header()}>
            <CardTitle className={styles.title()}>Proporção Geral</CardTitle>
          </CardHeader>
          <CardContent className={styles.body()}>
            {proportionData.length === 0 ? (
              <div className={styles.empty()}>Sem registros no período.</div>
            ) : (
              <div className={styles.chartWrap()}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={proportionData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="46%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {proportionData.map((slice) => (
                        <Cell
                          key={slice.key}
                          fill={slice.color}
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown, name: unknown) => [
                        String(value ?? 0),
                        String(name ?? ""),
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={styles.row()}>
        <Card className={`${styles.card()} lg:col-span-7`}>
          <CardHeader className={styles.header()}>
            <CardTitle className={styles.title()}>
              Frequência por Integrante
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.body()}>
            {memberChartData.length === 0 ? (
              <div className={styles.empty()}>Sem integrantes para exibir.</div>
            ) : (
              <div
                className="w-full min-w-0"
                style={{ height: `${memberChartHeight}px` }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={memberChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ fill: "var(--foreground)", fontSize: 11 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "6px" }} />
                    <Bar
                      dataKey="Presenças"
                      stackId="a"
                      fill="var(--success)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Faltas"
                      stackId="a"
                      fill="var(--destructive)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`${styles.card()} lg:col-span-5`}>
          <CardHeader className={styles.header()}>
            <CardTitle className={styles.title()}>
              Taxa de Presença por Setor (%)
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.body()}>
            {sectorChartData.length === 0 ? (
              <div className={styles.empty()}>Sem setores para exibir.</div>
            ) : (
              <div className={styles.chartWrap()}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectorChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="sector"
                      width={96}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ fill: "var(--foreground)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(val: unknown) => [`${val ?? 0}%`, "Taxa de Presença"]}
                    />
                    <Bar
                      dataKey="Frequência"
                      fill="var(--primary)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
