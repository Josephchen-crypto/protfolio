import type { CommentWithAuthor } from "@/lib/comments/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  onDelete: (commentId: number) => void;
}

export function CommentItem({
  comment,
  onDelete,
}: CommentItemProps) {
  // Format relative time
  const timeAgo = formatTimeAgo(new Date(comment.created_at));

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      {comment.author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.author.avatarUrl}
          alt={comment.author.displayName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">
          {comment.author.displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white text-sm">
            {comment.author.displayName}
          </span>
          <span className="text-xs text-slate-500">{timeAgo}</span>
          {comment.updated_at && (
            <span className="text-xs text-slate-600">(edited)</span>
          )}
        </div>

        <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {comment.canDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-red-400 transition-opacity mt-1"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Lightweight relative-time formatter. No heavy deps for a single line.
 */
function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  // Fallback to locale date for older comments
  return date.toLocaleDateString();
}