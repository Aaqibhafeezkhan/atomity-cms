import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

/** POST /api/auth/logout — the token is stateless, so signing out is dropping the cookie. */
export async function POST() {
  const response = NextResponse.json({ data: null });
  clearSessionCookie(response);
  return response;
}
