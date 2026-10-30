import { Search, X } from "lucide-react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export function SearchInput({ value, onChange, placeholder = "Search", label }: SearchInputProps) {
  return (
    <div className="relative">
      <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="input h-8 w-full pr-7 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
