import { TriangleAlert } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  error: Error;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", error, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-lg border border-[var(--color-error-border)] bg-error-bg px-5 py-8 text-center">
      <TriangleAlert size={20} className="text-error" aria-hidden />
      <div className="text-[13px] font-bold">{title}</div>
      <p className="max-w-[420px] text-[12px] text-error-text">{error.message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm mt-1" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
