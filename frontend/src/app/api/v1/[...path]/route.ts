import { NextResponse, type NextRequest } from "next/server";
import { backendBaseUrl, errorBody, forwardingHeaders } from "@/lib/backend";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/session";

/**
 * /api/v1/* → backend /api/v1/*, with the session cookie turned into a bearer token.
 *
 * This is the browser's only way to the backend: same-origin (no CORS), and the token
 * stays server-side. Bodies are streamed both ways, so image uploads and downloads
 * pass through without being buffered here.
 */

/** Request headers worth passing through; everything else (cookies included) stays here. */
const REQUEST_HEADERS = ["content-type", "content-length", "accept", "if-none-match"];
/** Response headers worth passing back. */
const RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "cache-control",
  "content-disposition",
  "etag",
  "x-content-type-options",
  "x-correlation-id",
];

async function proxy(request: NextRequest, ctx: RouteContext<"/api/v1/[...path]">): Promise<Response> {
  const { path } = await ctx.params;
  const target = `${backendBaseUrl()}/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = forwardingHeaders(request);
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let res: Response;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required by Node's fetch to stream a request body.
      ...(hasBody ? { duplex: "half" } : {}),
      cache: "no-store",
      redirect: "manual",
    } as RequestInit);
  } catch {
    return NextResponse.json(errorBody("BACKEND_UNAVAILABLE", "The server is unreachable. Try again shortly."), { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = res.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const response = new NextResponse(res.status === 204 || res.status === 304 ? null : res.body, {
    status: res.status,
    headers: responseHeaders,
  });
  // The token expired or was rejected: drop the cookie, so proxy.ts lets the
  // browser back onto /login instead of bouncing it to /content.
  if (res.status === 401 && token) clearSessionCookie(response);
  return response;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
