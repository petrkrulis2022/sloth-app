import { useState, useEffect, useCallback } from "react";
import { getComments, addComment } from "@/services/comment";
import { getCurrentSession } from "@/services/auth";
import type { CommentWithAuthor } from "@/types";

export interface CommentBoxProps {
  issueId: string;
}

/**
 * Displays comments in chronological order with author information
 * Supports threaded replies and adding new comments
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function CommentBox({ issueId }: CommentBoxProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getComments(issueId);
    if (result.success && result.data) {
      setComments(result.data);
    } else {
      setError(result.message || "Failed to load comments.");
    }

    setIsLoading(false);
  }, [issueId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle adding a new top-level comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    const session = getCurrentSession();
    if (!session) {
      setError("You must be logged in to comment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addComment(issueId, newComment.trim(), session.userId);

    if (result.success && result.data) {
      // Refresh comments to get the new one with author info
      await fetchComments();
      setNewComment("");
    } else {
      setError(result.message || "Failed to add comment.");
    }

    setIsSubmitting(false);
  };

  // Handle adding a reply to a comment
  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    const session = getCurrentSession();
    if (!session) {
      setError("You must be logged in to reply.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addComment(
      issueId,
      replyContent.trim(),
      session.userId,
      parentId
    );

    if (result.success && result.data) {
      // Refresh comments to get the new reply with author info
      await fetchComments();
      setReplyingTo(null);
      setReplyContent("");
    } else {
      setError(result.message || "Failed to add reply.");
    }

    setIsSubmitting(false);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get display name from author
  const getAuthorDisplayName = (author?: CommentWithAuthor["author"]) => {
    if (!author) return "Unknown";
    // Show email prefix or truncated wallet address
    if (author.email) {
      return author.email.split("@")[0];
    }
    return `${author.walletAddress.slice(0, 6)}...${author.walletAddress.slice(
      -4
    )}`;
  };

  // Organize comments into threads (top-level and replies)
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  // Render a single comment with its replies
  const renderComment = (comment: CommentWithAuthor, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? "ml-6 border-l-2 border-default pl-4" : ""}`}
    >
      <div className="bg-app rounded-md p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            {getAuthorDisplayName(comment.author)}
          </span>
          <span className="text-xs text-muted">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-secondary whitespace-pre-wrap">
          {comment.content}
        </p>
        {!isReply && (
          <button
            onClick={() => {
              setReplyingTo(comment.id);
              setReplyContent("");
            }}
            className="mt-2 text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            Reply
          </button>
        )}
      </div>

      {/* Reply input for this comment */}
      {replyingTo === comment.id && (
        <div className="ml-6 mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 bg-app border border-default rounded-md text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              autoFocus
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddReply(comment.id);
                }
                if (e.key === "Escape") {
                  setReplyingTo(null);
                  setReplyContent("");
                }
              }}
            />
            <button
              onClick={() => handleAddReply(comment.id)}
              disabled={!replyContent.trim() || isSubmitting}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
            >
              {isSubmitting ? "..." : "Reply"}
            </button>
            <button
              onClick={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
              className="px-3 py-2 text-secondary hover:text-primary transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Render replies */}
      {getReplies(comment.id).map((reply) => renderComment(reply, true))}
    </div>
  );

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          Comments
        </h3>
        <div className="text-sm text-muted animate-pulse">
          Loading comments...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        Comments
        {comments.length > 0 && (
          <span className="text-xs text-muted">({comments.length})</span>
        )}
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-md">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {topLevelComments.length === 0 ? (
          <div className="text-sm text-muted">No comments yet.</div>
        ) : (
          topLevelComments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* New comment input */}
      <form onSubmit={handleAddComment} className="mt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 bg-app border border-default rounded-md text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
          >
            {isSubmitting ? "..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
