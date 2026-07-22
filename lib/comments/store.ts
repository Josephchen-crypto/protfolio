import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CommentRow, CommentWithAuthor, CreateCommentPayload } from "./types";

/**
 * D1 data access for comments.
 *
 * Every function takes a `db` parameter — callers get it from
 * `getCloudflareContext()` so the route handler controls the lifecycle.
 * The store doesn't import side-effects itself, keeping it testable.
 */

function getDb(): D1Database | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as unknown as CloudflareEnv).BLOG_VIEWS_DB;
    return db ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch all comments for a post, newest first, joined with author info.
 * Returns an empty array (not null) on failure — the UI treats missing data
 * as "no comments yet".
 */
export async function listComments(
  postKey: string,
  currentUserId?: number,
): Promise<CommentWithAuthor[]> {
  const db = getDb();
  if (!db) return [];

  try {
    // LEFT JOIN users so we can show author name + avatar.
    // ORDER BY parent_id NULLS FIRST, then by created_at so top-level
    // comments come first (newest at top), then replies follow.
    const rows = await db
      .prepare(
        `SELECT
           c.id,
           c.parent_id,
           c.content,
           c.created_at,
           c.updated_at,
           c.user_id,
           u.display_name AS author_display_name,
           u.avatar_url   AS author_avatar_url,
           u.role         AS author_role
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.post_key = ?
         ORDER BY
           c.parent_id IS NOT NULL,
           c.created_at DESC`,
      )
      .bind(postKey)
      .all<{
        id: number;
        parent_id: number | null;
        content: string;
        created_at: string;
        updated_at: string | null;
        user_id: number;
        author_display_name: string | null;
        author_avatar_url: string | null;
        author_role: string;
      }>();

    return (rows.results ?? []).map((r) => ({
      id: r.id,
      parent_id: r.parent_id,
      content: r.content,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        userId: r.user_id,
        displayName: r.author_display_name ?? "Unknown",
        avatarUrl: r.author_avatar_url ?? null,
      },
      canDelete:
        currentUserId === r.user_id || r.author_role === "admin",
    }));
  } catch {
    return [];
  }
}

/**
 * Insert a new comment. Returns the new row, or null on failure.
 */
export async function createComment(
  userId: number,
  payload: CreateCommentPayload,
): Promise<CommentRow | null> {
  const db = getDb();
  if (!db) return null;

  const postKey = `${payload.lang}:${payload.slug}`;

  try {
    const result = await db
      .prepare(
        `INSERT INTO comments (post_key, lang, slug, user_id, parent_id, content)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`,
      )
      .bind(
        postKey,
        payload.lang,
        payload.slug,
        userId,
        payload.parent_id ?? null,
        payload.content.trim(),
      )
      .first<CommentRow>();

    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Delete a comment. Only succeeds if the caller is the author or an admin
 * (the route handler checks this before calling). Returns true if a row was
 * actually deleted.
 */
export async function deleteComment(
  commentId: number,
  userId: number,
  isAdmin: boolean,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const result = isAdmin
      ? await db
          .prepare(`DELETE FROM comments WHERE id = ?`)
          .bind(commentId)
          .run()
      : await db
          .prepare(`DELETE FROM comments WHERE id = ? AND user_id = ?`)
          .bind(commentId, userId)
          .run();

    return result.success && result.meta.changes > 0;
  } catch {
    return false;
  }
}