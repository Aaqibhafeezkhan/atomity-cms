import { cn } from "@/lib/utils";

export interface PanelProps {
  title?: string;
  /** Right side of the header — a counter, a small button. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Bordered card with an optional header row, matching atomity-product's Panel. */
export function Panel({ title, action, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={cn("flex flex-col rounded-lg border-[1.5px] border-line bg-card shadow-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
          <h2 className="micro-label">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn("p-3.5", bodyClassName)}>{children}</div>
    </section>
  );
}
