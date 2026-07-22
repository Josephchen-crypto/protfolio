/**
 * Core types for the comment system.
 *
 * `CommentRow` mirrors the D1 schema. `CommentWithAuthor` is what the API
 * returns — it joins the `users` table so the UI can display author info.
 */

export interface CommentRow {
  id: number;
  post_key: string;
  lang: string;
  slug: string;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * A comment returned by the API, enriched with the author's display name,
 * avatar URL, and whether the requesting user can delete it.
 */
export interface CommentWithAuthor {
  id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string | null;
  author: {
    userId: number;
    displayName: string;
    avatarUrl: string | null;
  };
  /** True if the current requesting user is the author or an admin. */
  canDelete: boolean;
}

/**
 * Payload accepted by the POST endpoint.
 */
export interface CreateCommentPayload {
  lang: "en" | "zh";
  slug: string;
  content: string;
  parent_id?: number | null;
}