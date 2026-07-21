import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT, type JWTPayload } from "./jwt";
import { getUserById, type UserRecord } from "./user-store";

/**
 * Shared session helpers so admin routes and server components don't each
 * re-implement JWT extraction + verification + user lookup.
 *
 * Two entry points, one for each caller context:
 *   - `getSessionFromRequest(request)` for route handlers (has NextRequest)
 *   - `getSessionFromCookies()` for React Server Components (uses next/headers)
 *
 * Both resolve to the same `Session` shape or null. Neither throws — invalid
 * tokens, missing users, and misconfigured JWT_SECRET all resolve to null so
 * callers can uniformly redirect / return 401.
 */

export interface Session {
  payload: JWTPayload;
  user: UserRecord;
}

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

/**
 * Verify the JWT and load the backing user record. Returns null if any step
 * fails — bad/missing token, expired token, or the user no longer exists.
 */
async function resolveSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const payload = await verifyJWT(token, secret);
    const user = await getUserById(payload.userId);
    if (!user) return null;
    return { payload, user };
  } catch {
    return null;
  }
}

/**
 * Read the session for a NextRequest — use inside `app/api/**` route handlers.
 */
export async function getSessionFromRequest(
  request: NextRequest,
): Promise<Session | null> {
  return resolveSession(request.cookies.get("auth-jwt")?.value);
}

/**
 * Read the session inside a React Server Component / server-side layout.
 * `cookies()` is only callable in a server-render context — importing this
 * function into a client component will fail at build time, which is what we
 * want.
 */
export async function getSessionFromCookies(): Promise<Session | null> {
  const store = await cookies();
  return resolveSession(store.get("auth-jwt")?.value);
}

/**
 * Convenience for admin gates. Returns the session iff the caller is an admin,
 * otherwise null.
 */
export function requireAdmin(session: Session | null): Session | null {
  if (!session) return null;
  return session.user.role === "admin" ? session : null;
}
