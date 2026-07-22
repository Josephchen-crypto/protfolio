import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth/session";
import { deleteComment } from "@/lib/comments/store";

/**
 * DELETE /api/comments/[postKey]/[commentId]
 *
 * Delete a comment. The caller must be the comment author or an admin.
 * Returns 204 on success, 403 if not allowed, 404 if not found.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postKey: string; commentId: string }> },
) {
  const { commentId: rawId } = await params;
  const commentId = Number(rawId);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isAdmin = Boolean(requireAdmin(session));
  const deleted = await deleteComment(commentId, session.user.id, isAdmin);

  if (!deleted) {
    return NextResponse.json(
      { error: "Comment not found or not allowed to delete" },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}

export const dynamic = "force-dynamic";