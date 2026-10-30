import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/** The dashed "nothing here yet" box — icon, heading, one line, optional action. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-line px-5 py-10 text-center",
        className,
      )}
    >
      <Icon size={20} className="text-[var(--atomity-gray-400)]" aria-hidden />
      <div className="text-[13px] font-bold">{title}</div>
      <p className="max-w-[340px] text-[12px] text-muted">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
