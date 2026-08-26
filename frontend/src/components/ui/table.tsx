import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The listing table, styled to the design system's 38px header strip and 50px
 * rows. It stays a real <table> — the column heads are the sort controls and
 * screen readers need the row/column relationship a grid of divs would lose.
 *
 * Layout is `table-fixed`: every column but the name column declares a width,
 * so the one that does not takes whatever is left.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full table-fixed border-collapse text-left", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("border-b border-edge bg-subtle", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-edge transition-colors last:border-b-0 hover:bg-subtle",
        // The first row is tinted so the header strip has something to sit on.
        "first:bg-subtle",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-9.5 px-2.5 type-eyebrow tracking-column uppercase font-medium text-faint first:pl-5 last:pr-5",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("h-12.5 px-2.5 align-middle first:pl-5 last:pr-5", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
