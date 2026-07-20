import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Logout endpoint: clears the auth-jwt cookie and redirects to homepage.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lang = searchParams.get("lang") ?? "en";
  const redirectTo = new URL(`/${lang}`, request.nextUrl.origin);

  const response = NextResponse.redirect(redirectTo);
  response.cookies.delete("auth-jwt");
  return response;
}
