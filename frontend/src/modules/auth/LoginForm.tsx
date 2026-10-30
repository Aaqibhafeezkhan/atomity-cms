"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

/** Only same-site paths are honoured for `?next=`, so the login page can't be used as an open redirect. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/content";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { errors?: { message: string }[] } | null;
        setError(json?.errors?.[0]?.message ?? "Sign-in failed. Try again.");
        setSubmitting(false);
        return;
      }
      router.replace(safeNext(next));
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input !py-2.5 !text-[14px]"
          placeholder="admin@example.com"
          aria-invalid={Boolean(error)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input !py-2.5 pr-10 !text-[14px]"
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-[var(--color-error-border)] bg-error-bg px-3 py-2 text-[12.5px] text-error-text">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-1 !h-11 w-full" disabled={submitting}>
        {submitting && <Spinner size={13} />}
        Sign in
      </button>
    </form>
  );
}
