import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_PATHS, SESSION_COOKIE } from "@/lib/session";

/**
 * Route gate: every page except /login needs a session cookie. Signed-out visitors
 * are sent to /login with the page they wanted in `?next=`, and signed-in ones
 * skip the login page.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!hasSession && !isPublic) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/content", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Pages only: skip route handlers, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
