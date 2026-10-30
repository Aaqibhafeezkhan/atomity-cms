import type { NextRequest } from "next/server";

/**
 * Base URL of the Spring Boot backend. Server-only: the browser never calls the
 * backend directly — it goes through this app's route handlers, which keeps the
 * backend off the public internet and the session token in an httpOnly cookie.
 */
export function backendBaseUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error("BACKEND_API_URL is not set. Add it to .env.local - see .env.example.");
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(`BACKEND_API_URL must start with "http://" or "https://" (got "${url}").`);
  }
  // Callers append their own leading "/" — strip a trailing one to avoid "//".
  return url.replace(/\/+$/, "");
}

/**
 * Headers passed on to the backend for every proxied call: the caller's address (the
 * backend rate-limits sign-in attempts per client) and the correlation ID, so one
 * request can be followed through both services' logs.
 */
export function forwardingHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const forwardedFor = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);
  const correlationId = request.headers.get("x-correlation-id");
  if (correlationId) headers.set("X-Correlation-ID", correlationId);
  return headers;
}

/** The error envelope, for failures that happen here rather than in the backend. */
export function errorBody(errorCode: string, message: string) {
  return { errors: [{ errorCode, message }] };
}
