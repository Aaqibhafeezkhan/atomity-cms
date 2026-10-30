import { NextResponse, type NextRequest } from "next/server";
import { backendBaseUrl, errorBody, forwardingHeaders } from "@/lib/backend";
import { setSessionCookie } from "@/lib/session";

interface LoginEnvelope {
  data?: { token: string; expiresAt: string };
  errors?: { errorCode: string; message: string }[];
}

/**
 * POST /api/auth/login — exchanges the admin credentials for the backend's JWT and
 * keeps it in the httpOnly session cookie. The token itself is never sent to the browser.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers = forwardingHeaders(request);
  headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${backendBaseUrl()}/api/v1/auth/login`, { method: "POST", headers, body, cache: "no-store" });
  } catch {
    return NextResponse.json(errorBody("BACKEND_UNAVAILABLE", "The server is unreachable. Try again shortly."), { status: 502 });
  }

  const json = (await res.json().catch(() => null)) as LoginEnvelope | null;
  if (!res.ok || !json?.data) {
    return NextResponse.json(json ?? errorBody("LOGIN_FAILED", "Sign-in failed. Try again."), { status: res.ok ? 502 : res.status });
  }

  const response = NextResponse.json({ data: { expiresAt: json.data.expiresAt } });
  setSessionCookie(response, json.data.token, json.data.expiresAt);
  return response;
}
