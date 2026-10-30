"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
}

export interface MultiSelectProps {
  id: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** When set, typing a name that doesn't exist offers "Create …". Resolves to the new option. */
  onCreate?: (label: string) => Promise<MultiSelectOption>;
  /** Renders a selected chip's leading visual (e.g. an avatar). */
  renderChipPrefix?: (option: MultiSelectOption) => React.ReactNode;
}

/**
 * Chips + type-ahead combobox for picking several items (authors, tags).
 * Keyboard: ↑/↓ to move, Enter to toggle, Backspace on an empty box removes the last chip.
 */
export function MultiSelect({ id, options, value, onChange, placeholder = "Search…", onCreate, renderChipPrefix }: MultiSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [creating, setCreating] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = value.flatMap((v) => options.filter((o) => o.id === v));
  const trimmed = query.trim();
  const matches = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase())),
    [options, trimmed],
  );
  const canCreate = Boolean(onCreate && trimmed && !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase()));
  const rowCount = matches.length + (canCreate ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const toggle = (optionId: string) => {
    onChange(value.includes(optionId) ? value.filter((v) => v !== optionId) : [...value, optionId]);
    setQuery("");
    setHighlight(0);
    inputRef.current?.focus();
  };

  const create = async () => {
    if (!onCreate || creating) return;
    setCreating(true);
    try {
      const option = await onCreate(trimmed);
      onChange([...value, option.id]);
      setQuery("");
    } finally {
      setCreating(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, rowCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (highlight < matches.length) toggle(matches[highlight].id);
      else if (canCreate) void create();
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && !query && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div
        className="input flex min-h-[34px] cursor-text flex-wrap items-center gap-1 !py-1"
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {selected.map((option) => (
          <span key={option.id} className="inline-flex items-center gap-1 rounded-full bg-hover py-0.5 pr-1 pl-1.5 text-[12px]">
            {renderChipPrefix?.(option)}
            {option.label}
            <button
              type="button"
              aria-label={`Remove ${option.label}`}
              onClick={(e) => {
                e.stopPropagation();
                toggle(option.id);
              }}
              className="cursor-pointer rounded-full p-0.5 text-muted hover:bg-line hover:text-ink"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length ? "" : placeholder}
          className="min-w-[80px] flex-1 border-none bg-transparent py-0.5 text-[13px] outline-none placeholder:text-[var(--atomity-gray-400)]"
        />
      </div>

      {open && rowCount > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-[var(--z-dropdown)] max-h-56 overflow-y-auto rounded-md border-[1.5px] border-line bg-card p-1 shadow-popover"
        >
          {matches.map((option, i) => {
            const isSelected = value.includes(option.id);
            return (
              <li
                key={option.id}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggle(option.id)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-[12.5px]",
                  highlight === i && "bg-hover",
                )}
              >
                {option.label}
                {isSelected && <Check size={13} className="text-green-dark" aria-hidden />}
              </li>
            );
          })}
          {canCreate && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void create()}
              onMouseEnter={() => setHighlight(matches.length)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-[12.5px]",
                highlight === matches.length && "bg-hover",
              )}
            >
              <Plus size={13} aria-hidden />
              {creating ? "Creating…" : <>Create “{trimmed}”</>}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
