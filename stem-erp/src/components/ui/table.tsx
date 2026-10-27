import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const tableStyles = tv({
  slots: {
    wrapper: "relative w-full overflow-auto",
    table: "w-full caption-bottom text-sm",
    header: "[&_tr]:border-b border-border",
    body: "[&_tr:last-child]:border-0",
    footer: "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
    row: "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
    head: "h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground [&:has([role=checkbox])]:pr-0",
    cell: "p-4 align-middle text-foreground [&:has([role=checkbox])]:pr-0",
    caption: "mt-4 text-sm text-muted-foreground",
  },
});

export type TableVariants = VariantProps<typeof tableStyles>;

const {
  wrapper: tableWrapper,
  table: tableBase,
  header: tableHeader,
  body: tableBody,
  footer: tableFooter,
  row: tableRow,
  head: tableHead,
  cell: tableCell,
  caption: tableCaption,
} = tableStyles();

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className={tableWrapper()}>
    <table
      ref={ref}
      className={tableBase({ className })}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={tableHeader({ className })} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={tableBody({ className })}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={tableFooter({ className })}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={tableRow({ className })}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={tableHead({ className })}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={tableCell({ className })}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={tableCaption({ className })}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
