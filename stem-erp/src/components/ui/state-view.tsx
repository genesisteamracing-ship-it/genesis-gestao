"use client";

import * as React from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const stateViewStyles = tv({
  slots: {
    container: "flex flex-col items-center justify-center p-8 text-center",
    iconWrapper: "mb-3 flex h-12 w-12 items-center justify-center rounded-full",
    title: "text-base font-semibold text-foreground",
    description: "mt-1 text-sm text-muted-foreground max-w-sm",
    action: "mt-4",
  },
  variants: {
    state: {
      loading: {
        iconWrapper: "bg-muted",
      },
      error: {
        iconWrapper: "bg-destructive/10 text-destructive",
      },
      empty: {
        iconWrapper: "bg-muted text-muted-foreground",
      },
      success: {
        iconWrapper: "bg-success/10 text-success",
      },
    },
  },
  defaultVariants: {
    state: "empty",
  },
});

export interface StateViewProps extends VariantProps<typeof stateViewStyles> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function StateView({
  state = "empty",
  title,
  description,
  onRetry,
  action,
  children,
  className,
}: StateViewProps) {
  const { container, iconWrapper, title: titleStyle, description: descStyle, action: actionStyle } =
    stateViewStyles({ state });

  if (state === "loading") {
    return (
      <div className={container({ className })}>
        <div className="w-full space-y-3">
          <Skeleton className="h-8 w-1/3 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
          <Skeleton className="h-32 w-full mt-4" />
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={container({ className })} role="alert">
        <div className={iconWrapper()}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <h4 className={titleStyle()}>{title ?? "Ocorreu um erro"}</h4>
        {description && <p className={descStyle()}>{description}</p>}
        {onRetry && (
          <div className={actionStyle()}>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tentar novamente</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className={container({ className })}>
        <div className={iconWrapper()}>
          <Inbox className="h-6 w-6" />
        </div>
        <h4 className={titleStyle()}>{title ?? "Nenhum registro encontrado"}</h4>
        {description && <p className={descStyle()}>{description}</p>}
        {action && <div className={actionStyle()}>{action}</div>}
      </div>
    );
  }

  return <>{children}</>;
}
