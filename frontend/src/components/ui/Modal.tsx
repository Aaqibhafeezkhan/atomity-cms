"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

/** Open dialogs, innermost last — only the top one reacts to Escape. */
const openStack: object[] = [];

export interface ModalProps {
  /** Names the dialog for screen readers and heads it on screen. */
  title: string;
  description?: string;
  onClose: () => void;
  maxWidth?: number;
  /** Buttons row pinned under the content. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0, // skips anything not actually displayed
  );
}

/**
 * The house dialog (after atomity-product's Modal): dimmed backdrop, Escape and
 * backdrop-click to dismiss, focus moves in on open and back to the opener on close.
 * Portaled to <body> so no ancestor can clip it.
 */
export function Modal({ title, description, onClose, maxWidth = 520, footer, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;

    // Focus the first real form field, else the first focusable element, else the dialog itself.
    const container = dialogRef.current;
    const firstField = container?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([type="file"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
    );
    (
      firstField ??
      getFocusable(contentRef.current)[0] ??
      getFocusable(container)[0] ??
      container
    )?.focus();

    const token = {};
    openStack.push(token);

    const onKeyDown = (event: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== token) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        const items = getFocusable(dialog);
        if (items.length === 0) {
          event.preventDefault();
          dialog?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        const outside = !dialog?.contains(active);

        if (event.shiftKey && (active === first || active === dialog || outside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || outside)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openStack.splice(openStack.indexOf(token), 1);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--backdrop)] p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex max-h-[calc(100vh-48px)] w-full flex-col rounded-2xl border-[1.5px] border-line bg-card shadow-modal outline-none"
        style={{ maxWidth }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 className="text-[15px] leading-snug font-bold">{title}</h2>
            {description && <p className="mt-1 text-[12px] text-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} size={24} iconSize={16} />
        </div>
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}