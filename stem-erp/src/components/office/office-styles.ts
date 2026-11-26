import { tv, type VariantProps } from "tailwind-variants";

export const officeRoomStyles = tv({
  slots: {
    container:
      "relative h-full w-full select-none [--pixel-ink:var(--foreground)] dark:[--pixel-ink:var(--background)]",
    sign:
      "pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-popover px-2.5 py-0.5 text-[11px] font-extrabold tracking-tight text-popover-foreground shadow-sm whitespace-nowrap",
    signAccentDot: "h-2 w-2 shrink-0 rounded-full",
    countPill:
      "inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.2 text-[10px] font-extrabold text-foreground",
  },
  variants: {
    zone: {
      ENGINEERING_CAD: {
        signAccentDot: "bg-primary",
      },
      MANUFACTURING_CNC: {
        signAccentDot: "bg-warning",
      },
      PIT_DISPLAY: {
        signAccentDot: "bg-purple",
      },
      MARKETING_SPONSOR: {
        signAccentDot: "bg-magenta",
      },
      PROJECT_MANAGEMENT: {
        signAccentDot: "bg-success",
      },
      SOCIAL_PROJECT: {
        signAccentDot: "bg-peach",
      },
      BRIEFING_ROOM: {
        signAccentDot: "bg-amber",
      },
      LOUNGE_CAFE: {
        signAccentDot: "bg-chart-4",
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
    card: "group relative flex w-[136px] h-[108px] flex-col items-center justify-end select-none cursor-pointer transition-transform duration-150 focus-visible:outline-none [--pixel-ink:var(--foreground)] dark:[--pixel-ink:var(--background)]",
    speechBubble:
      "pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 inline-flex max-w-[164px] items-center gap-1 rounded-md border-2 px-2 py-0.5 text-[10px] font-bold leading-tight shadow-sm whitespace-nowrap transition-transform duration-150 group-hover:-translate-y-0.5",
    speechTail:
      "pointer-events-none absolute -bottom-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r-2 border-b-2",
    stage:
      "relative flex h-[76px] w-[124px] items-center justify-center",
    selectionRing:
      "pointer-events-none absolute inset-x-1.5 bottom-1 top-3 rounded-xl border-2 transition-opacity",
    nameTag:
      "relative z-20 -mt-1 inline-flex max-w-[134px] items-center gap-1 rounded-full border border-border bg-popover/95 px-2 py-0.5 text-[10px] font-extrabold text-popover-foreground shadow-xs",
    statusDot: "h-1.5 w-1.5 shrink-0 rounded-full",
  },
  variants: {
    status: {
      WORKING: {
        speechBubble:
          "border-border bg-card text-card-foreground dark:border-border dark:bg-foreground dark:text-background",
        speechTail:
          "border-border bg-card dark:border-border dark:bg-foreground",
        statusDot: "bg-success animate-pulse",
      },
      OVERDUE: {
        speechBubble:
          "border-warning bg-amber text-secondary-foreground dark:text-background",
        speechTail: "border-warning bg-amber",
        statusDot: "bg-destructive animate-pulse",
      },
      IDLE: {
        speechBubble:
          "border-border bg-popover/95 text-muted-foreground opacity-90 group-hover:opacity-100",
        speechTail: "border-border bg-popover",
        statusDot: "bg-muted-foreground/70",
      },
    },
    selected: {
      true: {
        card: "scale-[1.05]",
        selectionRing: "border-primary bg-primary/15 opacity-100 shadow-sm",
        nameTag: "border-primary ring-1 ring-primary/50",
      },
      false: {
        selectionRing:
          "border-primary/40 bg-primary/5 opacity-0 group-hover:opacity-100",
      },
    },
    dimmed: {
      true: {
        card: "opacity-30 grayscale-[55%]",
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

export const officeRaciBadgeStyles = tv({
  base: "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[4px] px-1 text-[9px] font-black leading-none tracking-tight shadow-2xs",
  variants: {
    role: {
      R: "bg-warning text-warning-foreground",
      A: "bg-primary text-primary-foreground",
      C: "bg-purple text-purple-foreground",
      I: "bg-muted text-foreground border border-border",
    },
  },
  defaultVariants: {
    role: "R",
  },
});

export type OfficeRaciBadgeVariants = VariantProps<
  typeof officeRaciBadgeStyles
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

export const officeStatusSquareStyles = tv({
  base: "inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] border",
  variants: {
    status: {
      WORKING: "border-success bg-success",
      OVERDUE: "border-destructive bg-destructive animate-pulse",
      IDLE: "border-border bg-muted-foreground/35",
    },
  },
  defaultVariants: {
    status: "IDLE",
  },
});
