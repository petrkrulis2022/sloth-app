import { db } from "@/db";
import type { Issue } from "@/types";

/**
 * Error types for issue operations
 */
export type IssueError =
  | "ISSUE_NOT_FOUND"
  | "VIEW_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "INVALID_NAME"
  | "UNKNOWN_ERROR";

export interface IssueResponse<T> {
  success: boolean;
  data?: T;
  error?: IssueError;
  message?: string;
}

/**
 * Converts database issue record to Issue type
 */
function toIssue(dbIssue: {
  id: string;
  view_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}): Issue {
  return {
    id: dbIssue.id,
    viewId: dbIssue.view_id,
    parentId: dbIssue.parent_id,
    name: dbIssue.name,
    description: dbIssue.description,
    createdBy: dbIssue.created_by,
    createdAt: new Date(dbIssue.created_at),
    updatedAt: new Date(dbIssue.updated_at),
  };
}

export function validateIssueName(name: string): boolean {
  return name !== undefined && name !== null && name.trim().length > 0;
}

/**
 * Gets all issues for a view
 */
export async function getIssues(
  viewId: string,
  includeSubIssues: boolean = false
): Promise<IssueResponse<Issue[]>> {
  try {
    const { data: view } = await db
      .from("views")
      .select("id")
      .eq("id", viewId)
      .single();

    if (!view) {
      return {
        success: false,
        error: "VIEW_NOT_FOUND",
        message: "View not found.",
      };
    }

    let query = db.from("issues").select("*").eq("view_id", viewId);

    if (!includeSubIssues) {
      query = query.is("parent_id", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: (data || []).map(toIssue) };
  } catch (error) {
    console.error("Get issues error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch issues.",
    };
  }
}

/**
 * Gets a single issue by ID
 */
export async function getIssue(issueId: string): Promise<IssueResponse<Issue>> {
  try {
    const { data, error } = await db
      .from("issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      };
    }

    return { success: true, data: toIssue(data) };
  } catch (error) {
    console.error("Get issue error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch issue.",
    };
  }
}

/**
 * Creates a new issue in a view
 */
export async function createIssue(
  viewId: string,
  name: string,
  description: string | null,
  createdBy: string
): Promise<IssueResponse<Issue>> {
  if (!validateIssueName(name)) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "Issue name is required.",
    };
  }

  try {
    const { data: view } = await db
      .from("views")
      .select("id")
      .eq("id", viewId)
      .single();

    if (!view) {
      return {
        success: false,
        error: "VIEW_NOT_FOUND",
        message: "View not found.",
      };
    }

    const { data, error } = await db
      .from("issues")
      .insert({
        view_id: viewId,
        name: name.trim(),
        description: description?.trim() || null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create issue.",
      };
    }

    return { success: true, data: toIssue(data) };
  } catch (error) {
    console.error("Create issue error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to create issue.",
    };
  }
}

/**
 * Creates a sub-issue under a parent issue
 */
export async function createSubIssue(
  parentId: string,
  name: string,
  description: string | null,
  createdBy: string
): Promise<IssueResponse<Issue>> {
  if (!validateIssueName(name)) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "Issue name is required.",
    };
  }

  try {
    const { data: parentIssue } = await db
      .from("issues")
      .select("view_id")
      .eq("id", parentId)
      .single();

    if (!parentIssue) {
      return {
        success: false,
        error: "PARENT_NOT_FOUND",
        message: "Parent issue not found.",
      };
    }

    const { data, error } = await db
      .from("issues")
      .insert({
        view_id: parentIssue.view_id,
        parent_id: parentId,
        name: name.trim(),
        description: description?.trim() || null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create sub-issue.",
      };
    }

    return { success: true, data: toIssue(data) };
  } catch (error) {
    console.error("Create sub-issue error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to create sub-issue.",
    };
  }
}

/**
 * Updates an existing issue
 */
export async function updateIssue(
  issueId: string,
  updates: { name?: string; description?: string | null }
): Promise<IssueResponse<Issue>> {
  if (updates.name !== undefined && !validateIssueName(updates.name)) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "Issue name cannot be empty.",
    };
  }

  try {
    const { data: existingIssue } = await db
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .single();

    if (!existingIssue) {
      return {
        success: false,
        error: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      };
    }

    const updateData: Record<string, string | null> = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.description !== undefined)
      updateData.description = updates.description?.trim() || null;

    const { data, error } = await db
      .from("issues")
      .update(updateData)
      .eq("id", issueId)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to update issue.",
      };
    }

    return { success: true, data: toIssue(data) };
  } catch (error) {
    console.error("Update issue error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to update issue.",
    };
  }
}

/**
 * Deletes an issue
 */
export async function deleteIssue(
  issueId: string
): Promise<IssueResponse<void>> {
  try {
    const { data: existingIssue } = await db
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .single();

    if (!existingIssue) {
      return {
        success: false,
        error: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      };
    }

    // Delete sub-issues first
    await db.from("issues").delete().eq("parent_id", issueId);

    // Delete the issue
    const { error } = await db.from("issues").delete().eq("id", issueId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Delete issue error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to delete issue.",
    };
  }
}

/**
 * Gets all sub-issues for a parent issue
 */
export async function getSubIssues(
  parentId: string
): Promise<IssueResponse<Issue[]>> {
  try {
    const { data: parentIssue } = await db
      .from("issues")
      .select("id")
      .eq("id", parentId)
      .single();

    if (!parentIssue) {
      return {
        success: false,
        error: "PARENT_NOT_FOUND",
        message: "Parent issue not found.",
      };
    }

    const { data, error } = await db
      .from("issues")
      .select("*")
      .eq("parent_id", parentId);

    if (error) throw error;

    return { success: true, data: (data || []).map(toIssue) };
  } catch (error) {
    console.error("Get sub-issues error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch sub-issues.",
    };
  }
}
