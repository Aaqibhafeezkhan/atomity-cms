import { cn } from "@/lib/utils";

export interface TypeChipProps {
  /** The type's display name, e.g. "Knowledge base". */
  children: React.ReactNode;
  className?: string;
}

/** Outlined pill naming an item's content type; kept visually apart from the filled status chips. */
export function TypeChip({ children, className }: TypeChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border border-line px-[9px] py-[1px] text-[11px] font-semibold text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}
