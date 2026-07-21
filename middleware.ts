import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Two responsibilities:
 *
 *   1. Redirect the bare root `/` to the default language (`/en`).
 *   2. Defence-in-depth for `/[lang]/admin/**` — if no auth cookie is present,
 *      redirect to the login page instead of rendering. This is NOT the
 *      security boundary; `app/[lang]/admin/layout.tsx` re-verifies the JWT
 *      server-side and enforces the admin role. Doing a cheap presence check
 *      here just avoids rendering the layout for anonymous callers and
 *      shields us against CVE-2025-29927-style middleware bypasses (we don't
 *      grant anything, we only redirect away).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", request.url));
  }

  const adminMatch = pathname.match(/^\/(en|zh)\/admin(?:\/|$)/);
  if (adminMatch) {
    const hasAuthCookie = Boolean(request.cookies.get("auth-jwt")?.value);
    if (!hasAuthCookie) {
      const lang = adminMatch[1];
      const loginUrl = new URL(`/${lang}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
}

export const config = {
  matcher: ["/", "/:lang(en|zh)/admin/:path*"],
};
