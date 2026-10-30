import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@/types/api";
import { IconButton } from "./IconButton";

export interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  noun?: string;
}

export function Pagination({ meta, onPageChange, noun = "items" }: PaginationProps) {
  const first = meta.totalElements === 0 ? 0 : meta.page * meta.size + 1;
  const last = Math.min((meta.page + 1) * meta.size, meta.totalElements);
  return (
    <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
      <span className="tabular-nums">
        {first}–{last} of {meta.totalElements} {noun}
      </span>
      <div className="flex items-center gap-1">
        <IconButton icon={ChevronLeft} label="Previous page" disabled={meta.page === 0} onClick={() => onPageChange(meta.page - 1)} />
        <span className="px-1 font-mono text-[11px] tabular-nums">
          {meta.page + 1} / {meta.totalPages}
        </span>
        <IconButton
          icon={ChevronRight}
          label="Next page"
          disabled={meta.page >= meta.totalPages - 1}
          onClick={() => onPageChange(meta.page + 1)}
        />
      </div>
    </div>
  );
}
