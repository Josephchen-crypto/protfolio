import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProvider } from "@/lib/auth/providers";
import type { ProviderId } from "@/lib/auth/providers/types";
import { parseState, validateState } from "@/lib/auth/state";
import { parseAdminWhitelist, determineRole } from "@/lib/auth/roles";
import { signJWT } from "@/lib/auth/jwt";
import {
  findUserByProviderIdentity,
  findUserByEmail,
  createUserWithIdentity,
  linkIdentityToUser,
  updateLastLogin,
  type UserRecord,
} from "@/lib/auth/user-store";

const ADMIN_WHITELIST = parseAdminWhitelist(process.env.ADMIN_GITHUB_USERS);
const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const providerId = request.nextUrl.pathname.split("/")[3] as ProviderId;
  const code = searchParams.get("code");
  const stateQuery = searchParams.get("state");
  const stateCookie = request.cookies.get("oauth-state")?.value;

  // Validate required parameters
  if (!code || !stateQuery || !stateCookie) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  // CSRF check: state from cookie must match state from query
  if (!validateState(stateCookie, stateQuery)) {
    return NextResponse.json(
      { error: "Invalid state parameter (CSRF check failed)" },
      { status: 403 },
    );
  }

  // Parse the state to get the language we started with
  const parsedState = parseState(stateCookie);
  if (!parsedState) {
    return NextResponse.json(
      { error: "Invalid state format" },
      { status: 400 },
    );
  }

  const { lang } = parsedState;

  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json(
      { error: `Provider "${providerId}" is not enabled` },
      { status: 404 },
    );
  }

  // Build the redirect URI that was registered with the provider
  // It must match exactly what's registered on the OAuth app
  const callbackUrl = new URL(
    `/api/auth/${providerId}/callback`,
    request.nextUrl.origin,
  );

  try {
    // Exchange code for access token
    const token = await provider.exchangeCodeForToken(code, callbackUrl.toString());
    // Fetch normalized user profile
    const profile = await provider.fetchUserProfile(token.accessToken);
    // Determine role based on admin whitelist
    const role = determineRole(profile, ADMIN_WHITELIST);

    // Find existing user identity (if this provider has logged in before)
    let user: UserRecord | null = null;
    const existingIdentity = await findUserByProviderIdentity(
      profile.provider,
      profile.providerUserId,
    );

    if (existingIdentity) {
      // We already have this identity → get the user from database
      const { getUserById } = await import("@/lib/auth/user-store");
      user = await getUserById(existingIdentity.user_id);
    } else if (profile.email) {
      // No existing identity, but we have an email → check if a user exists
      // with this email from another provider → automatically link them
      user = await findUserByEmail(profile.email);
      if (user) {
        // Link this new identity to the existing user
        await linkIdentityToUser(user.id, profile);
      }
    }

    // If we still don't have a user → create a new one with this identity
    if (!user) {
      user = await createUserWithIdentity(profile, role);
      if (!user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 },
        );
      }
    }

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Sign JWT with user info
    const jwt = await signJWT(
      {
        userId: user.id,
        username: profile.username,
        role: user.role,
        provider: profile.provider,
      },
      JWT_SECRET,
    );

    // Redirect to the homepage in the correct language
    const redirectUrl = new URL(`/${lang}`, request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl);

    // Set JWT cookie — HTTP-only, Secure, SameSite=Lax
    response.cookies.set("auth-jwt", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Clear the oauth-state cookie (we don't need it anymore)
    response.cookies.delete("oauth-state");

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
