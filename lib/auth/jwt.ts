import { SignJWT, jwtVerify } from "jose";
import type { ProviderId } from "../auth/providers/types";

/**
 * JWT Payload structure stored in the cookie.
 * Contains all the info we need for authentication and authorization.
 *
 * - `userId`: the primary key from the `users` table
 * - `username`: login username from the OAuth provider
 * - `role`: "admin" or "user" (determined by the admin whitelist)
 * - `provider`: which provider the user logged in with
 * - `exp`: expiration timestamp (automatically added by SignJWT)
 */
export interface JWTPayload {
  userId: number;
  username: string;
  role: "admin" | "user";
  provider: ProviderId;
  exp: number;
}

const JWT_ALG = "HS256";
const DEFAULT_EXPIRATION_DAYS = 7;

/**
 * Sign a JWT with the given payload and secret.
 * Uses HS256 (symmetric signature) which is simple and secure for this use case.
 * Expires after 7 days by default.
 */
export async function signJWT(
  payload: Omit<JWTPayload, "exp">,
  secret: string,
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setExpirationTime(`${DEFAULT_EXPIRATION_DAYS}d`)
    .sign(secretKey);
}

/**
 * Verify a JWT signature and expiration.
 * Returns the parsed payload if valid, throws an error if invalid.
 */
export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload> {
  const secretKey = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as JWTPayload;
}
