import { tv } from "tailwind-variants";

export const sidebarItemStyles = tv({
  base: "flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
  variants: {
    isActive: {
      true: "bg-primary text-primary-foreground shadow-xs",
      false: "text-foreground hover:bg-muted",
    },
    isSubItem: {
      true: "py-2.5 pl-4 pr-3 text-xs",
      false: "",
    },
  },
  defaultVariants: {
    isActive: false,
    isSubItem: false,
  },
});
