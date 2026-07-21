import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/admin/stats-store";

/**
 * GET /api/admin/stats
 *
 * Returns aggregated dashboard data. Admin-only:
 *   - 401 when there is no valid session
 *   - 403 when the user is authenticated but not an admin
 *
 * Response body: {@link DashboardStats}
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getDashboardStats();
  return NextResponse.json(stats);
}

// Always compute fresh — the dashboard shows near-real-time view counts.
export const dynamic = "force-dynamic";
