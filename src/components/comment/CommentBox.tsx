import { useState, useEffect, useCallback } from "react";
import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
} from "@/services/comment";
import { getCurrentSession } from "@/services/auth";
import type { CommentWithAuthor } from "@/types";

export interface CommentBoxProps {
  issueId: string;
}

/**
 * Displays issue notes in chronological order with author information.
 * Supports threaded replies, editing, and deleting.
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(
    null
  );
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getComments(issueId);
    if (result.success && result.data) {
      setComments(result.data);
    } else {
      setError(result.message || "Failed to load notes.");
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
      setError("You must be logged in to add a note.");
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
      setError(result.message || "Failed to add note.");
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

  // Handle starting an edit
  const handleStartEdit = (comment: CommentWithAuthor) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  // Handle saving an edited note
  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSavingEdit(true);
    setError(null);

    const result = await updateComment(commentId, editContent);

    if (result.success) {
      setEditingCommentId(null);
      setEditContent("");
      await fetchComments();
    } else {
      setError(result.message || "Failed to update note.");
    }

    setIsSavingEdit(false);
  };

  // Handle deleting a note
  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    const result = await deleteComment(commentId);
    if (result.success) {
      await fetchComments();
    } else {
      setError(result.message || "Failed to delete note.");
    }
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
      <div className="bg-app rounded-md p-3 mb-2 group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            {getAuthorDisplayName(comment.author)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {formatDate(comment.createdAt)}
            </span>
            {editingCommentId !== comment.id && (
              <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                <button
                  onClick={() => handleStartEdit(comment)}
                  className="text-muted hover:text-teal-400 p-0.5"
                  title="Edit note"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-muted hover:text-red-400 p-0.5"
                  title="Delete note"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        {editingCommentId === comment.id ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-default rounded-md text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 resize-none"
              rows={3}
              disabled={isSavingEdit}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
                className="px-3 py-1 text-xs text-secondary hover:text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(comment.id)}
                disabled={!editContent.trim() || isSavingEdit}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors"
              >
                {isSavingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-secondary whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
        {!isReply && editingCommentId !== comment.id && (
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Notes
        </h3>
        <div className="text-sm text-muted animate-pulse">
          Loading notes...
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Notes
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

      {/* Notes list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {topLevelComments.length === 0 ? (
          <div className="text-sm text-muted">No notes yet.</div>
        ) : (
          topLevelComments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* New note input */}
      <form onSubmit={handleAddComment} className="mt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a note..."
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
