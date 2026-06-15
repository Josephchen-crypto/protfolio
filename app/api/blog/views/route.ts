import { NextRequest, NextResponse } from "next/server";
import {
  isValidViewPayload,
  parseViewKeysParam,
} from "@/lib/blog-views";
import { batchGetViews, incrementView } from "@/lib/blog-views-store";

/**
 * POST /api/blog/views
 *
 * Increment the view count for a single blog post (client-side dedupe is expected).
 * Body: { lang: "en" | "zh", slug: string }
 * Response: { views: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isValidViewPayload(body)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { lang: 'en'|'zh', slug: string }." },
        { status: 400 },
      );
    }

    const views = await incrementView(body);

    // When the D1 binding is unavailable (dev / static build), return 0 gracefully.
    return NextResponse.json({ views: views ?? 0 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/blog/views?keys=en:foo,zh:bar
 *
 * Batch-read view counts for one or more post keys.
 * Response: { "en:foo": 5, "zh:bar": 0 }
 */
export async function GET(request: NextRequest) {
  try {
    const keys = parseViewKeysParam(request.nextUrl.searchParams.get("keys"));

    if (keys.length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'keys' is required (comma-separated post keys)." },
        { status: 400 },
      );
    }

    const result = await batchGetViews(keys);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
