import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const cardStyles = tv({
  slots: {
    base: "rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-colors",
    header: "flex flex-col space-y-1.5 p-6",
    title: "font-semibold leading-none tracking-tight text-foreground",
    description: "text-sm text-muted-foreground",
    content: "p-6 pt-0",
    footer: "flex items-center p-6 pt-0",
  },
});

export type CardVariants = VariantProps<typeof cardStyles>;

const {
  base: cardBase,
  header: cardHeader,
  title: cardTitle,
  description: cardDescription,
  content: cardContent,
  footer: cardFooter,
} = cardStyles();

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cardBase({ className })}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cardHeader({ className })}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cardTitle({ className })}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cardDescription({ className })}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cardContent({ className })} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cardFooter({ className })}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
