import { cn } from "@/lib/utils";

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string;
  /** Marks the field as required (to save or, here, to publish) with an asterisk. */
  required?: boolean;
  /** Shows "current / max" beside the label, turning red past the limit. */
  count?: { current: number; max: number };
  children: React.ReactNode;
  className?: string;
}

/** Label + control + hint/error, with an optional character counter. */
export function Field({ label, htmlFor, hint, error, required, count, children, className }: FieldProps) {
  const over = count && count.current > count.max;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required && (
            <span aria-hidden className="text-error">
              {" "}
              *
            </span>
          )}
        </label>
        {count && (
          <span className={cn("font-mono text-[10px] tabular-nums", over ? "font-bold text-error" : "text-muted")} aria-live="polite">
            {count.current}/{count.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] text-error-text" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
