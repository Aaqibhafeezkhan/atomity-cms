import { cn } from "@/lib/utils";

export interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Switch({ id, checked, onChange, label, description }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer">
        <div className="text-[13px] font-semibold">{label}</div>
        {description && <div className="text-[11.5px] text-muted">{description}</div>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-[18px] w-8 shrink-0 cursor-pointer rounded-full transition-colors",
          checked ? "bg-green-dark" : "bg-[var(--atomity-gray-300)]",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-card shadow-card transition-transform",
            checked && "translate-x-[14px]",
          )}
        />
      </button>
    </div>
  );
}
