import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";
import { getUserById } from "@/lib/auth/user-store";

let JWT_SECRET: string | undefined;

function getEnv() {
  if (!JWT_SECRET) {
    JWT_SECRET = process.env.JWT_SECRET;
  }
  return {
    JWT_SECRET: JWT_SECRET!,
  };
}

/**
 * Get the currently authenticated user.
 * Returns 401 if not authenticated or invalid token.
 * Response: { userId, username, role, provider, displayName, avatarUrl }
 */
export async function GET(request: NextRequest) {
  const { JWT_SECRET } = getEnv();
  const token = request.cookies.get("auth-jwt")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const payload = await verifyJWT(token, JWT_SECRET);
    const user = await getUserById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      userId: user.id,
      username: payload.username,
      role: user.role,
      provider: payload.provider,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
