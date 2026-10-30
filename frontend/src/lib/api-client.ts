"use client";

import { ApiError, type PageMeta } from "@/types/api";

/*
 * The browser side of every API call. Requests go to this app's own /api/v1 proxy
 * (see app/api/v1/[...path]/route.ts), which adds the session token and forwards them
 * to the backend. Responses arrive in the backend's envelope:
 *   success: { data, meta? }   failure: { errors: [{ errorCode, message }] }
 */

interface Envelope<T> {
  data?: T;
  meta?: PageMeta;
  errors?: { errorCode: string; message: string }[];
}

export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
}

/** Sends the browser to the login page, returning here afterwards. */
function redirectToLogin(): void {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server. Check your connection and try again.", 0);
  }

  if (res.status === 204) return { data: undefined as T };

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok) {
    if (res.status === 401) redirectToLogin();
    const error = json?.errors?.[0];
    throw new ApiError(error?.errorCode ?? "HTTP_ERROR", error?.message ?? `Request failed (${res.status}).`, res.status);
  }
  return { data: json?.data as T, meta: json?.meta };
}

/** GET/DELETE/POST without a body. Returns `data` only. */
export async function api<T>(method: string, path: string): Promise<T> {
  return (await apiRequest<T>(path, { method })).data;
}

/** POST/PUT/PATCH with a JSON body. Returns `data` only. */
export async function apiJson<T>(method: string, path: string, body: unknown): Promise<T> {
  const result = await apiRequest<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return result.data;
}

/** Builds a query string, skipping empty values. */
export function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
