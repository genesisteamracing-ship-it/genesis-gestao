import { tv, type VariantProps } from "tailwind-variants";

export const officeRoomStyles = tv({
  slots: {
    container:
      "relative h-full w-full rounded-2xl border-2 bg-card/85 backdrop-blur-[2px] transition-colors select-none",
    header:
      "flex items-center justify-between gap-2 border-b px-3.5 py-2 rounded-t-[14px]",
    title:
      "text-[11px] font-extrabold uppercase tracking-wider truncate",
    counter:
      "text-[10px] font-semibold text-muted-foreground whitespace-nowrap",
  },
  variants: {
    zone: {
      ENGINEERING_CAD: {
        container: "border-primary/35",
        header: "border-primary/20 bg-primary/10",
        title: "text-primary",
      },
      MANUFACTURING_CNC: {
        container: "border-warning/40",
        header: "border-warning/25 bg-warning/10",
        title: "text-warning",
      },
      PIT_DISPLAY: {
        container: "border-purple/35",
        header: "border-purple/20 bg-purple/10",
        title: "text-purple",
      },
      MARKETING_SPONSOR: {
        container: "border-magenta/35",
        header: "border-magenta/20 bg-magenta/10",
        title: "text-magenta",
      },
      PROJECT_MANAGEMENT: {
        container: "border-success/35",
        header: "border-success/20 bg-success/10",
        title: "text-success",
      },
      SOCIAL_PROJECT: {
        container: "border-peach/40",
        header: "border-peach/25 bg-peach/10",
        title: "text-peach",
      },
      BRIEFING_ROOM: {
        container: "border-border bg-muted/45",
        header: "border-border bg-muted/80",
        title: "text-foreground",
      },
      LOUNGE_CAFE: {
        container: "border-border bg-muted/35",
        header: "border-border bg-muted/70",
        title: "text-foreground",
      },
    },
  },
  defaultVariants: {
    zone: "BRIEFING_ROOM",
  },
});

export type OfficeRoomStyleVariants = VariantProps<typeof officeRoomStyles>;

export const officeDeskNodeStyles = tv({
  slots: {
    card: "group relative flex w-[196px] flex-col items-center rounded-xl border bg-card/95 p-2.5 shadow-xs transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    nameTag:
      "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold shadow-2xs",
    statusDot: "h-2 w-2 shrink-0 rounded-full",
    stage:
      "relative mt-1.5 flex h-[62px] w-full items-center justify-center rounded-lg border border-border/70 bg-muted/45 overflow-hidden",
    taskPill:
      "mt-1.5 flex w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold leading-tight",
    typingBubble:
      "absolute top-1 right-1.5 inline-flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-0.5 shadow-2xs",
  },
  variants: {
    status: {
      WORKING: {
        card: "border-success/45 hover:border-success",
        nameTag: "border-success/30 bg-success/10 text-foreground",
        statusDot: "bg-success animate-pulse",
        taskPill: "border-primary/30 bg-primary/10 text-foreground",
      },
      OVERDUE: {
        card: "border-destructive/55 hover:border-destructive",
        nameTag: "border-destructive/35 bg-destructive/10 text-foreground",
        statusDot: "bg-destructive animate-pulse",
        taskPill: "border-destructive/35 bg-destructive/10 text-destructive",
      },
      IDLE: {
        card: "border-border hover:border-primary/50",
        nameTag: "border-border bg-muted/70 text-foreground",
        statusDot: "bg-muted-foreground/60",
        taskPill: "border-border/80 bg-muted/50 text-muted-foreground",
      },
    },
    selected: {
      true: {
        card: "ring-2 ring-primary border-primary shadow-md scale-[1.02]",
      },
      false: {},
    },
    dimmed: {
      true: {
        card: "opacity-35 grayscale-[45%]",
      },
      false: {},
    },
  },
  defaultVariants: {
    status: "IDLE",
    selected: false,
    dimmed: false,
  },
});

export type OfficeDeskNodeStyleVariants = VariantProps<
  typeof officeDeskNodeStyles
>;

export const officeStatusBadgeStyles = tv({
  base: "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
  variants: {
    status: {
      WORKING: "border-success/35 bg-success/15 text-success",
      OVERDUE: "border-destructive/35 bg-destructive/15 text-destructive",
      IDLE: "border-border bg-muted text-muted-foreground",
    },
  },
  defaultVariants: {
    status: "IDLE",
  },
});

export type OfficeStatusBadgeVariants = VariantProps<
  typeof officeStatusBadgeStyles
>;
