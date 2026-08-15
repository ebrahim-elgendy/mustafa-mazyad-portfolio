import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

// Optimistic check only — the actual mutating routes (app/api/upload/**)
// re-verify the session themselves, since Proxy can be bypassed by a matcher
// change or a route that doesn't pass through it.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/upload"],
};
