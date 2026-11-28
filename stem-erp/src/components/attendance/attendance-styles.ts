import { tv } from "tailwind-variants";

export const attendanceKpiStyles = tv({
  slots: {
    grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
    card: "rounded-2xl border border-border bg-card shadow-xs min-w-0",
    content: "p-4 sm:p-5",
    topRow: "flex items-start justify-between gap-3",
    label: "text-xs sm:text-sm font-medium text-muted-foreground truncate",
    value: "mt-2 text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight truncate",
    iconWrap: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
    footer: "mt-3 text-xs text-muted-foreground truncate",
  },
  variants: {
    tone: {
      primary: {
        value: "text-primary",
        iconWrap: "bg-primary/15 text-primary",
      },
      success: {
        value: "text-success",
        iconWrap: "bg-success/15 text-success",
      },
      destructive: {
        value: "text-destructive",
        iconWrap: "bg-destructive/15 text-destructive",
      },
      chart4: {
        value: "text-foreground",
        iconWrap: "bg-chart-4/15 text-chart-4",
      },
    },
  },
  defaultVariants: {
    tone: "primary",
  },
});

export const attendanceChartCardStyles = tv({
  slots: {
    row: "grid grid-cols-1 gap-4 lg:grid-cols-12",
    card: "rounded-2xl border border-border bg-card shadow-xs min-w-0",
    header: "p-4 sm:p-5 pb-2",
    title: "text-sm sm:text-base font-bold text-foreground",
    body: "p-4 sm:p-5 pt-0",
    chartWrap: "h-64 w-full min-w-0",
    empty: "flex h-64 items-center justify-center text-xs text-muted-foreground",
  },
});

export const attendanceRateBarStyles = tv({
  slots: {
    wrapper: "flex items-center gap-2 min-w-[110px]",
    track: "h-2 flex-1 overflow-hidden rounded-full bg-muted",
    fill: "h-full rounded-full transition-all",
    label: "w-11 text-right font-mono text-xs font-semibold text-foreground",
  },
  variants: {
    level: {
      high: {
        fill: "bg-success",
      },
      medium: {
        fill: "bg-warning",
      },
      low: {
        fill: "bg-destructive",
      },
    },
  },
  defaultVariants: {
    level: "high",
  },
});
