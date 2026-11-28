"use client";

import { CalendarCheck2, CheckCircle2, Percent, UserX } from "lucide-react";
import { formatIsoDateBR } from "@/lib/training-attendance";
import type { AttendanceAnalyticsDTO } from "@/types/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { attendanceKpiStyles } from "./attendance-styles";

interface AttendanceKpisProps {
  analytics: AttendanceAnalyticsDTO;
}

export function AttendanceKpis({ analytics }: AttendanceKpisProps) {
  const baseStyles = attendanceKpiStyles();
  const rateStyles = attendanceKpiStyles({ tone: "primary" });
  const presenceStyles = attendanceKpiStyles({ tone: "success" });
  const absenceStyles = attendanceKpiStyles({ tone: "destructive" });
  const latestStyles = attendanceKpiStyles({ tone: "chart4" });

  const latestLabel = analytics.latestTrainingDate
    ? `${formatIsoDateBR(analytics.latestTrainingDate)} · ${analytics.latestTrainingAbsences} ${
        analytics.latestTrainingAbsences === 1 ? "falta" : "faltas"
      }`
    : "Sem treinos no período";

  return (
    <section
      aria-label="Indicadores de Presença nos Treinos"
      className={baseStyles.grid()}
    >
      <Card className={rateStyles.card()}>
        <CardContent className={rateStyles.content()}>
          <div className={rateStyles.topRow()}>
            <div className="min-w-0 flex-1">
              <p className={rateStyles.label()}>Taxa de Presença</p>
              <p className={rateStyles.value()}>
                {analytics.overallAttendanceRate.toFixed(1)}%
              </p>
            </div>
            <div className={rateStyles.iconWrap()}>
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <p className={rateStyles.footer()}>
            {analytics.totalTrainingDays}{" "}
            {analytics.totalTrainingDays === 1 ? "treino" : "treinos"} no período
          </p>
        </CardContent>
      </Card>

      <Card className={presenceStyles.card()}>
        <CardContent className={presenceStyles.content()}>
          <div className={presenceStyles.topRow()}>
            <div className="min-w-0 flex-1">
              <p className={presenceStyles.label()}>Presenças</p>
              <p className={presenceStyles.value()}>{analytics.totalPresences}</p>
            </div>
            <div className={presenceStyles.iconWrap()}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className={presenceStyles.footer()}>
            {analytics.perfectAttendanceMembersCount} integrante(s) com 100%
          </p>
        </CardContent>
      </Card>

      <Card className={absenceStyles.card()}>
        <CardContent className={absenceStyles.content()}>
          <div className={absenceStyles.topRow()}>
            <div className="min-w-0 flex-1">
              <p className={absenceStyles.label()}>Faltas</p>
              <p className={absenceStyles.value()}>{analytics.totalAbsences}</p>
            </div>
            <div className={absenceStyles.iconWrap()}>
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <p className={absenceStyles.footer()}>
            {analytics.membersWithAbsencesCount} integrante(s) com falta
          </p>
        </CardContent>
      </Card>

      <Card className={latestStyles.card()}>
        <CardContent className={latestStyles.content()}>
          <div className={latestStyles.topRow()}>
            <div className="min-w-0 flex-1">
              <p className={latestStyles.label()}>Último Treino</p>
              <p className={latestStyles.value()}>
                {analytics.latestTrainingPresences}/{analytics.totalTrackedMembers}
              </p>
            </div>
            <div className={latestStyles.iconWrap()}>
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </div>
          <p className={latestStyles.footer()}>{latestLabel}</p>
        </CardContent>
      </Card>
    </section>
  );
}
