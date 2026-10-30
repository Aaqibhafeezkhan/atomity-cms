import type { NextResponse } from "next/server";

/**
 * Session cookie shared by proxy.ts (the route gate), the auth route handlers and the
 * API proxy. It holds the JWT the backend issues at login — httpOnly, so client code
 * never sees it; the API proxy forwards it as `Authorization: Bearer`.
 */
export const SESSION_COOKIE = "atomitycms_session";

/** Routes reachable without a session. */
export const PUBLIC_PATHS = ["/login"];

/**
 * Secure cookies are only sent over HTTPS (browsers make an exception for localhost).
 * On by default in production; set SESSION_COOKIE_SECURE=false to serve over plain
 * HTTP on another host, e.g. a LAN test box.
 */
function secureCookies(): boolean {
  const flag = process.env.SESSION_COOKIE_SECURE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "production";
}

/** Stores the token, expiring the cookie together with the token itself. */
export function setSessionCookie(response: NextResponse, token: string, expiresAt: string): void {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}
