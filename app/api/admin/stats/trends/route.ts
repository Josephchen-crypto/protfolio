import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth/session";
import { getTrendPoints } from "@/lib/admin/trends-store";
import type { Granularity } from "@/lib/admin/trends";

/**
 * GET /api/admin/stats/trends?granularity=day|month
 *
 * Returns the dense trend series for the selected window (30 days or 12
 * months). Admin-only:
 *   - 401 when there is no valid session
 *   - 403 when the user is authenticated but not an admin
 *   - 400 when granularity is missing / invalid
 *
 * Response: `{ granularity, points: [{ label, count }] }`
 */
function isGranularity(value: string | null): value is Granularity {
  return value === "day" || value === "month";
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = request.nextUrl.searchParams.get("granularity");
  if (!isGranularity(raw)) {
    return NextResponse.json(
      { error: "granularity must be 'day' or 'month'" },
      { status: 400 },
    );
  }

  const points = await getTrendPoints(raw);
  return NextResponse.json({ granularity: raw, points });
}

export const dynamic = "force-dynamic";
