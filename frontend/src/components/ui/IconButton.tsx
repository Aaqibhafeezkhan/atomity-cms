import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  /** Tooltip and accessible name — an icon button has no visible text. */
  label: string;
  size?: number;
  iconSize?: number;
  active?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/** Square ghost button: no frame at rest, a soft fill on hover. */
export function IconButton({ icon: Icon, label, size = 28, iconSize, active, className, ref, ...props }: IconButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-hover text-ink",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon size={iconSize ?? Math.round(size * 0.55)} />
    </button>
  );
}
