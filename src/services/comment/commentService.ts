import { db } from "@/db";
import type { Comment, CommentWithAuthor } from "@/types";

/**
 * Error types for comment operations
 */
export type CommentError =
  | "COMMENT_NOT_FOUND"
  | "ISSUE_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "INVALID_CONTENT"
  | "UNKNOWN_ERROR";

export interface CommentResponse<T> {
  success: boolean;
  data?: T;
  error?: CommentError;
  message?: string;
}

/**
 * Converts database comment record to Comment type
 */
function toComment(dbComment: {
  id: string;
  issue_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}): Comment {
  return {
    id: dbComment.id,
    issueId: dbComment.issue_id,
    parentId: dbComment.parent_id,
    authorId: dbComment.author_id,
    content: dbComment.content,
    createdAt: new Date(dbComment.created_at),
    updatedAt: new Date(dbComment.updated_at),
  };
}

export function validateCommentContent(content: string): boolean {
  return content !== undefined && content !== null && content.trim().length > 0;
}

/**
 * Gets all comments for an issue
 */
export async function getComments(
  issueId: string
): Promise<CommentResponse<CommentWithAuthor[]>> {
  try {
    const { data: issue } = await db
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .single();

    if (!issue) {
      return {
        success: false,
        error: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      };
    }

    const { data: comments, error } = await db
      .from("comments")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Get author info for each comment
    const authorIds = [...new Set((comments || []).map((c) => c.author_id))];
    let authors: Record<
      string,
      { id: string; email: string; wallet_address: string }
    > = {};

    if (authorIds.length > 0) {
      const { data: users } = await db
        .from("users")
        .select("id, email, wallet_address")
        .in("id", authorIds);

      authors = (users || []).reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as typeof authors);
    }

    const commentsWithAuthor: CommentWithAuthor[] = (comments || []).map(
      (c) => ({
        ...toComment(c),
        author: authors[c.author_id]
          ? {
              id: authors[c.author_id].id,
              email: authors[c.author_id].email,
              walletAddress: authors[c.author_id].wallet_address,
            }
          : undefined,
      })
    );

    return { success: true, data: commentsWithAuthor };
  } catch (error) {
    console.error("Get comments error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch comments.",
    };
  }
}

/**
 * Adds a new comment to an issue
 */
export async function addComment(
  issueId: string,
  content: string,
  authorId: string,
  parentId?: string
): Promise<CommentResponse<Comment>> {
  if (!validateCommentContent(content)) {
    return {
      success: false,
      error: "INVALID_CONTENT",
      message: "Comment content is required.",
    };
  }

  try {
    const { data: issue } = await db
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .single();

    if (!issue) {
      return {
        success: false,
        error: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      };
    }

    if (parentId) {
      const { data: parentComment } = await db
        .from("comments")
        .select("issue_id")
        .eq("id", parentId)
        .single();

      if (!parentComment) {
        return {
          success: false,
          error: "PARENT_NOT_FOUND",
          message: "Parent comment not found.",
        };
      }

      if (parentComment.issue_id !== issueId) {
        return {
          success: false,
          error: "PARENT_NOT_FOUND",
          message: "Parent comment does not belong to this issue.",
        };
      }
    }

    const { data, error } = await db
      .from("comments")
      .insert({
        issue_id: issueId,
        parent_id: parentId || null,
        author_id: authorId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create comment.",
      };
    }

    return { success: true, data: toComment(data) };
  } catch (error) {
    console.error("Add comment error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to add comment.",
    };
  }
}

/**
 * Deletes a comment
 */
export async function deleteComment(
  commentId: string
): Promise<CommentResponse<void>> {
  try {
    const { data: existingComment } = await db
      .from("comments")
      .select("id")
      .eq("id", commentId)
      .single();

    if (!existingComment) {
      return {
        success: false,
        error: "COMMENT_NOT_FOUND",
        message: "Comment not found.",
      };
    }

    // Delete replies first
    await db.from("comments").delete().eq("parent_id", commentId);

    // Delete the comment
    const { error } = await db.from("comments").delete().eq("id", commentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Delete comment error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to delete comment.",
    };
  }
}

/**
 * Gets a single comment by ID
 */
export async function getComment(
  commentId: string
): Promise<CommentResponse<Comment>> {
  try {
    const { data, error } = await db
      .from("comments")
      .select("*")
      .eq("id", commentId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "COMMENT_NOT_FOUND",
        message: "Comment not found.",
      };
    }

    return { success: true, data: toComment(data) };
  } catch (error) {
    console.error("Get comment error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch comment.",
    };
  }
}
