"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import type { Dict } from "@/i18n";
import type { CommentWithAuthor, CreateCommentPayload } from "@/lib/comments/types";

interface CommentsSectionProps {
  dict: Dict;
  lang: "en" | "zh";
  slug: string;
}

/**
 * Full comment section for a blog post.
 *
 * Client component: fetches comments on mount, handles post and delete.
 * The current user is detected via a lightweight fetch to `/api/auth/me`
 * (no separate JWT decode on the client side). If the user isn't signed in,
 * a prompt to log in is shown instead of the comment form.
 */
export function CommentsSection({ dict, lang, slug }: CommentsSectionProps) {
  const postKey = `${lang}:${slug}`;
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/${postKey}`);
      if (res.ok) {
        setComments((await res.json()) as CommentWithAuthor[]);
      }
    } catch {
      // silently fail — the UI shows the empty state
    } finally {
      setLoading(false);
    }
  }, [postKey]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as { userId: number };
        setCurrentUserId(data.userId);
      }
    } catch {
      // not authenticated — that's fine
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchComments();
  }, [fetchComments, fetchCurrentUser]);

  const handlePost = async (content: string, parentId: number | null = null) => {
    const payload: CreateCommentPayload = { lang, slug, content, parent_id: parentId };
    const res = await fetch(`/api/comments/${postKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error: string };
      throw new Error(err.error ?? dict.blog.comments.errorPost);
    }

    setReplyTo(null);
    await fetchComments();
  };

  const handleDelete = async (commentId: number) => {
    try {
      await fetch(`/api/comments/${postKey}/${commentId}`, {
        method: "DELETE",
      });
      await fetchComments();
    } catch {
      // ignore
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = useCallback(
    (parentId: number) => comments.filter((c) => c.parent_id === parentId),
    [comments],
  );

  return (
    <Card className="mt-12">
      <h2 className="text-xl font-heading font-bold text-white mb-2">
        {dict.blog.comments.count.replace("{count}", String(comments.length))}
      </h2>

      {currentUserId ? (
        <div className="mb-8">
          <CommentForm
            placeholder={dict.blog.comments.placeholder}
            submitLabel={dict.blog.comments.post}
            onSubmit={async (content) => handlePost(content)}
          />
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-lg bg-background text-center">
          <a
            href={`/${lang}/login`}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {dict.blog.comments.loginToComment}
          </a>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface rounded w-24" />
                <div className="h-4 bg-surface rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-slate-400 text-sm">{dict.blog.comments.empty}</p>
      ) : (
        <div className="space-y-6">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onDelete={handleDelete}
              />

              {/* Replies */}
              {replies(comment.id).length > 0 && (
                <div className="ml-12 mt-3 space-y-4">
                  {replies(comment.id).map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {/* Reply button + inline form */}
              {currentUserId && (
                <div className="ml-12 mt-2">
                  {replyTo === comment.id ? (
                    <CommentForm
                      placeholder={`${dict.blog.comments.reply}…`}
                      submitLabel={dict.blog.comments.reply}
                      onCancel={() => setReplyTo(null)}
                      onSubmit={async (content) => handlePost(content, comment.id)}
                    />
                  ) : (
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-xs text-slate-500 hover:text-neon-cyan transition-colors"
                    >
                      {dict.blog.comments.reply}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}