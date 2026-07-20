import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProvider } from "@/lib/auth/providers";
import type { ProviderId } from "@/lib/auth/providers/types";
import { generateState } from "@/lib/auth/state";
import { getLangFromUrl } from "@/i18n/config";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const providerId = searchParams.get("provider") as ProviderId | null;
  const lang = getLangFromUrl(request.nextUrl);

  if (!providerId) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 });
  }

  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json(
      { error: `Provider "${providerId}" is not enabled` },
      { status: 404 },
    );
  }

  // Build the callback URL — we need to tell GitHub where to redirect back to
  const callbackUrl = new URL(
    `/api/auth/${providerId}/callback`,
    request.nextUrl.origin,
  );

  // Generate state with embedded language (so we can redirect back to the
  // correct language version of the site after login)
  const state = generateState(lang);

  // Store the state in an HTTP-only cookie for CSRF protection
  const authorizeUrl = provider.getAuthorizeUrl({
    state,
    redirectUri: callbackUrl.toString(),
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("oauth-state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes — enough time for OAuth flow
  });

  return response;
}
