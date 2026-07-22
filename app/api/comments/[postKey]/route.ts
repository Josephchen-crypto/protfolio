import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { listComments, createComment } from "@/lib/comments/store";
import type { CreateCommentPayload } from "@/lib/comments/types";

/**
 * GET /api/comments/[postKey]
 *
 * Returns all comments for a post, newest first, with author info.
 * Authentication is optional — anyone can read comments.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postKey: string }> },
) {
  const { postKey } = await params;
  const session = await getSessionFromRequest(request);
  const comments = await listComments(postKey, session?.user.id);
  return NextResponse.json(comments);
}

/**
 * POST /api/comments/[postKey]
 *
 * Create a new comment. Requires authentication.
 * Body: { lang, slug, content, parent_id? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postKey: string }> },
) {
  const { postKey } = await params;
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as CreateCommentPayload;

  // Validate required fields
  if (!payload.lang || !payload.slug || !payload.content) {
    return NextResponse.json(
      { error: "lang, slug, and content are required" },
      { status: 400 },
    );
  }

  const trimmed = payload.content.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "Content cannot be empty" },
      { status: 400 },
    );
  }

  if (trimmed.length > 5000) {
    return NextResponse.json(
      { error: "Content is too long (max 5000 characters)" },
      { status: 400 },
    );
  }

  // Verify the postKey matches lang:slug
  const expectedKey = `${payload.lang}:${payload.slug}`;
  if (expectedKey !== postKey) {
    return NextResponse.json(
      { error: "postKey does not match lang:slug" },
      { status: 400 },
    );
  }

  const comment = await createComment(session.user.id, payload);
  if (!comment) {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }

  return NextResponse.json(comment, { status: 201 });
}

export const dynamic = "force-dynamic";