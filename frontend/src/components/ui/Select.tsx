import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

/** Native <select> in the house input style — keeps keyboard and mobile behaviour for free. */
export function Select({ options, className, ...props }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select {...props} className="input h-8 cursor-pointer appearance-none !py-0 pr-7">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}
