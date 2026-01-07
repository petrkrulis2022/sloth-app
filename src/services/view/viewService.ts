import { db } from "@/db";
import type { View } from "@/types";

/**
 * Error types for view operations
 */
export type ViewError =
  | "VIEW_NOT_FOUND"
  | "PROJECT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_NAME"
  | "INVALID_TAG"
  | "DUPLICATE_TAG"
  | "UNKNOWN_ERROR";

export interface ViewResponse<T> {
  success: boolean;
  data?: T;
  error?: ViewError;
  message?: string;
}

/**
 * Converts database view record to View type
 */
function toView(dbView: {
  id: string;
  project_id: string;
  name: string;
  tag: string;
  chat_session_id: string | null;
  chat_session_name: string | null;
  ai_model: string | null;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}): View {
  return {
    id: dbView.id,
    projectId: dbView.project_id,
    name: dbView.name,
    tag: dbView.tag,
    chatSessionId: dbView.chat_session_id,
    chatSessionName: dbView.chat_session_name,
    aiModel: dbView.ai_model || "sonar-pro",
    systemPrompt: dbView.system_prompt,
    createdAt: new Date(dbView.created_at),
    updatedAt: new Date(dbView.updated_at),
  };
}

export function validateViewName(name: string): boolean {
  return name !== undefined && name !== null && name.trim().length > 0;
}

export function validateViewTag(tag: string): boolean {
  return (
    tag !== undefined &&
    tag !== null &&
    tag.trim().length > 0 &&
    tag.trim().length <= 10
  );
}

/**
 * Gets all views for a project
 */
export async function getViews(
  projectId: string
): Promise<ViewResponse<View[]>> {
  try {
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return {
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    }

    const { data, error } = await db
      .from("views")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return { success: true, data: (data || []).map(toView) };
  } catch (error) {
    console.error("Get views error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch views.",
    };
  }
}

/**
 * Gets a single view by ID
 */
export async function getView(viewId: string): Promise<ViewResponse<View>> {
  try {
    const { data, error } = await db
      .from("views")
      .select("*")
      .eq("id", viewId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "VIEW_NOT_FOUND",
        message: "View not found.",
      };
    }

    return { success: true, data: toView(data) };
  } catch (error) {
    console.error("Get view error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch view.",
    };
  }
}

/**
 * Creates a new view in a project
 */
export async function createView(
  projectId: string,
  name: string,
  tag: string
): Promise<ViewResponse<View>> {
  if (!validateViewName(name)) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "View name is required.",
    };
  }

  if (!validateViewTag(tag)) {
    return {
      success: false,
      error: "INVALID_TAG",
      message: "View tag is required and must be 10 characters or less.",
    };
  }

  try {
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return {
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    }

    // Check for duplicate tag
    const { data: existingTag } = await db
      .from("views")
      .select("id")
      .eq("project_id", projectId)
      .eq("tag", tag.trim().toUpperCase())
      .single();

    if (existingTag) {
      return {
        success: false,
        error: "DUPLICATE_TAG",
        message: "A view with this tag already exists in the project.",
      };
    }

    const { data, error } = await db
      .from("views")
      .insert({
        project_id: projectId,
        name: name.trim(),
        tag: tag.trim().toUpperCase(),
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create view.",
      };
    }

    return { success: true, data: toView(data) };
  } catch (error) {
    console.error("Create view error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to create view.",
    };
  }
}

/**
 * Updates an existing view
 */
export async function updateView(
  viewId: string,
  updates: { name?: string; tag?: string }
): Promise<ViewResponse<View>> {
  if (updates.name !== undefined && !validateViewName(updates.name)) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "View name cannot be empty.",
    };
  }

  if (updates.tag !== undefined && !validateViewTag(updates.tag)) {
    return {
      success: false,
      error: "INVALID_TAG",
      message: "View tag cannot be empty and must be 10 characters or less.",
    };
  }

  try {
    const { data: existingView } = await db
      .from("views")
      .select("*")
      .eq("id", viewId)
      .single();

    if (!existingView) {
      return {
        success: false,
        error: "VIEW_NOT_FOUND",
        message: "View not found.",
      };
    }

    if (updates.tag) {
      const normalizedTag = updates.tag.trim().toUpperCase();
      const { data: duplicateTag } = await db
        .from("views")
        .select("id")
        .eq("project_id", existingView.project_id)
        .eq("tag", normalizedTag)
        .neq("id", viewId)
        .single();

      if (duplicateTag) {
        return {
          success: false,
          error: "DUPLICATE_TAG",
          message: "A view with this tag already exists in the project.",
        };
      }
    }

    const updateData: Record<string, string> = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.tag !== undefined)
      updateData.tag = updates.tag.trim().toUpperCase();

    const { data, error } = await db
      .from("views")
      .update(updateData)
      .eq("id", viewId)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to update view.",
      };
    }

    return { success: true, data: toView(data) };
  } catch (error) {
    console.error("Update view error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to update view.",
    };
  }
}

/**
 * Deletes a view
 */
export async function deleteView(viewId: string): Promise<ViewResponse<void>> {
  try {
    const { data: existingView } = await db
      .from("views")
      .select("id")
      .eq("id", viewId)
      .single();

    if (!existingView) {
      return {
        success: false,
        error: "VIEW_NOT_FOUND",
        message: "View not found.",
      };
    }

    const { error } = await db.from("views").delete().eq("id", viewId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Delete view error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to delete view.",
    };
  }
}

/**
 * Checks if a user has access to a view
 */
export async function hasViewAccess(
  viewId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data: view } = await db
      .from("views")
      .select("project_id")
      .eq("id", viewId)
      .single();

    if (!view) return false;

    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", view.project_id)
      .eq("owner_id", userId)
      .single();

    if (project) return true;

    const { data: collab } = await db
      .from("project_collaborators")
      .select("id")
      .eq("project_id", view.project_id)
      .eq("user_id", userId)
      .single();

    return !!collab;
  } catch {
    return false;
  }
}

const DEFAULT_SYSTEM_PROMPTS: Record<string, string> = {
  default:
    "You are a strategic product manager and planning assistant. Help users think through high-level strategy, goals, and planning for their projects.",
};

export function getDefaultSystemPrompt(viewType: string): string {
  return DEFAULT_SYSTEM_PROMPTS[viewType] || DEFAULT_SYSTEM_PROMPTS.default;
}
