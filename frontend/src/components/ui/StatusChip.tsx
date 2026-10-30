import { cn } from "@/lib/utils";
import type { PostStatus } from "@/types/post";

export type ChipTone = "published" | "draft" | "archived" | "danger" | "neutral";

const TONE_CLASSES: Record<ChipTone, string> = {
  published: "bg-[var(--chip-published-bg)] text-ink",
  draft: "bg-[var(--chip-draft-bg)] text-ink",
  archived: "bg-[var(--chip-archived-bg)] text-muted",
  danger: "bg-[var(--chip-danger-bg)] text-ink",
  neutral: "bg-hover text-muted",
};

export interface StatusChipProps {
  tone?: ChipTone;
  children: React.ReactNode;
  className?: string;
}

/** Pill status marker — mono uppercase, as in atomity-product. */
export function StatusChip({ tone = "neutral", children, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-[9px] py-[2px] font-mono text-[10px] font-bold uppercase tracking-[0.06em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<PostStatus, ChipTone> = {
  PUBLISHED: "published",
  DRAFT: "draft",
  ARCHIVED: "archived",
};

export function PostStatusChip({ status }: { status: PostStatus }) {
  return <StatusChip tone={STATUS_TONE[status]}>{status.toLowerCase()}</StatusChip>;
}
