import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  /** CSS width for the column, e.g. "120px" or "40%". */
  width?: string;
  /** Makes the header a sort control; needs `sort` and `onSortChange` on the table. */
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: DataTableSort;
  onSortChange?: (key: string) => void;
  /** Shows shimmer rows instead of data (on first load, when there are no rows yet). */
  loading?: boolean;
  skeletonRows?: number;
  /** Label for screen readers. */
  caption: string;
}

/**
 * Plain table with the dashboard's row rhythm (after atomity-product's DataTable).
 * Clickable rows are also reachable by keyboard: Enter opens them.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  sort,
  onSortChange,
  loading,
  skeletonRows = 6,
  caption,
}: DataTableProps<T>) {
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        {columns.map((c) => (
          <col key={c.key} style={{ width: c.width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((c) => {
            const active = sort?.key === c.key;
            const sortable = c.sortable && onSortChange;
            return (
              <th
                key={c.key}
                scope="col"
                aria-sort={sortable ? (active ? (sort!.direction === "asc" ? "ascending" : "descending") : "none") : undefined}
                className={cn(
                  "border-b border-line px-3 py-2 text-[11.5px] font-bold whitespace-nowrap text-muted",
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                )}
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange!(c.key)}
                    className={cn("inline-flex cursor-pointer items-center gap-1", active && "text-ink")}
                  >
                    {c.header}
                    <span aria-hidden className={cn("text-[0.85em]", !active && "opacity-35")}>
                      {active ? (sort!.direction === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                ) : (
                  c.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {loading && rows.length === 0
          ? Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((c) => (
                  <td key={c.key} className="border-b border-line px-3 py-3">
                    <div className="skeleton h-3.5 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          : rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" && e.target === e.currentTarget) onRowClick(row);
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "transition-colors [&:last-child>td]:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-subtle",
                  loading && "opacity-60",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "border-b border-line px-3 py-2.5 align-middle text-[12.5px]",
                      c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
      </tbody>
    </table>
  );
}
