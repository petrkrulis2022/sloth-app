import { db } from "@/db";
import type { Project, View } from "@/types";
import type { User } from "@/types/auth";

/**
 * Error types for project operations
 */
export type ProjectError =
  | "PROJECT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_NAME"
  | "UNKNOWN_ERROR";

export interface ProjectResponse<T> {
  success: boolean;
  data?: T;
  error?: ProjectError;
  message?: string;
}

/**
 * Converts database project record to Project type
 */
function toProject(dbProject: {
  id: string;
  name: string;
  owner_id: string;
  notes: string | null;
  perplexity_space_id: string | null;
  perplexity_space_name: string | null;
  perplexity_api_key: string | null;
  created_at: string;
  updated_at: string;
}): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    ownerId: dbProject.owner_id,
    notes: dbProject.notes,
    perplexitySpaceId: dbProject.perplexity_space_id,
    perplexitySpaceName: dbProject.perplexity_space_name,
    perplexityApiKey: dbProject.perplexity_api_key,
    createdAt: new Date(dbProject.created_at),
    updatedAt: new Date(dbProject.updated_at),
  };
}

/**
 * Converts database view record to View type
 */
function toView(dbView: {
  id: string;
  project_id: string;
  name: string;
  tag: string;
  icon: string | null;
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
    icon: dbView.icon,
    chatSessionId: dbView.chat_session_id,
    chatSessionName: dbView.chat_session_name,
    aiModel: dbView.ai_model || "sonar-pro",
    systemPrompt: dbView.system_prompt,
    createdAt: new Date(dbView.created_at),
    updatedAt: new Date(dbView.updated_at),
  };
}

/**
 * Converts database user record to User type
 */
function toUser(dbUser: {
  id: string;
  email: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    walletAddress: dbUser.wallet_address,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  };
}

/**
 * Gets all projects for a user (owned or collaborated)
 */
export async function getProjects(
  userId: string
): Promise<ProjectResponse<Project[]>> {
  try {
    // Get projects owned by user
    const { data: ownedProjects, error: ownedError } = await db
      .from("projects")
      .select("*")
      .eq("owner_id", userId);

    if (ownedError) throw ownedError;

    // Get projects where user is a collaborator
    const { data: collaborations, error: collabError } = await db
      .from("project_collaborators")
      .select("project_id")
      .eq("user_id", userId)
      .eq("role", "collaborator");

    if (collabError) throw collabError;

    const collabProjectIds = collaborations?.map((c) => c.project_id) || [];

    let collaboratedProjects: typeof ownedProjects = [];
    if (collabProjectIds.length > 0) {
      const { data, error } = await db
        .from("projects")
        .select("*")
        .in("id", collabProjectIds);
      if (error) throw error;
      collaboratedProjects = data || [];
    }

    // Combine and deduplicate
    const allProjects = [
      ...(ownedProjects || []).map(toProject),
      ...(collaboratedProjects || []).map(toProject),
    ];

    const uniqueProjects = allProjects.filter(
      (project, index, self) =>
        index === self.findIndex((p) => p.id === project.id)
    );

    return { success: true, data: uniqueProjects };
  } catch (error) {
    console.error("Get projects error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch projects.",
    };
  }
}

/**
 * Gets a single project by ID
 */
export async function getProject(
  projectId: string
): Promise<ProjectResponse<Project>> {
  try {
    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: "Project not found or you don't have access.",
      };
    }

    return { success: true, data: toProject(data) };
  } catch (error) {
    console.error("Get project error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch project.",
    };
  }
}

/**
 * Creates a new project
 */
export async function createProject(
  name: string,
  ownerId: string
): Promise<ProjectResponse<Project>> {
  if (!name || name.trim().length === 0) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "Project name is required.",
    };
  }

  try {
    const { data, error } = await db
      .from("projects")
      .insert({ name: name.trim(), owner_id: ownerId })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create project.",
      };
    }

    return { success: true, data: toProject(data) };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to create project.",
    };
  }
}

/**
 * Copies a project structure (views and tags) without copying issues or content
 */
export async function copyProject(
  projectId: string,
  newOwnerId: string
): Promise<ProjectResponse<Project>> {
  try {
    const { data: originalProject, error: projectError } = await db
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !originalProject) {
      return {
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    }

    // Create new project
    const { data: newProject, error: createError } = await db
      .from("projects")
      .insert({
        name: `${originalProject.name} (Copy)`,
        owner_id: newOwnerId,
      })
      .select()
      .single();

    if (createError || !newProject) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to copy project.",
      };
    }

    // Get original views
    const { data: originalViews } = await db
      .from("views")
      .select("*")
      .eq("project_id", projectId);

    // Copy views
    if (originalViews && originalViews.length > 0) {
      const viewsToInsert = originalViews.map((v) => ({
        project_id: newProject.id,
        name: v.name,
        tag: v.tag,
      }));
      await db.from("views").insert(viewsToInsert);
    }

    return { success: true, data: toProject(newProject) };
  } catch (error) {
    console.error("Copy project error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to copy project.",
    };
  }
}

/**
 * Gets all collaborators for a project (including owner)
 */
export async function getCollaborators(
  projectId: string
): Promise<ProjectResponse<User[]>> {
  try {
    const { data: project, error: projectError } = await db
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    }

    // Get owner
    const { data: owner } = await db
      .from("users")
      .select("*")
      .eq("id", project.owner_id)
      .single();

    // Get collaborators
    const { data: collaborations } = await db
      .from("project_collaborators")
      .select("user_id")
      .eq("project_id", projectId);

    const userIds = collaborations?.map((c) => c.user_id) || [];
    let collaboratorUsers: User[] = [];

    if (userIds.length > 0) {
      const { data: users } = await db
        .from("users")
        .select("*")
        .in("id", userIds);
      collaboratorUsers = (users || []).map(toUser);
    }

    const allUsers: User[] = [];
    if (owner) allUsers.push(toUser(owner));
    for (const user of collaboratorUsers) {
      if (!allUsers.some((u) => u.id === user.id)) {
        allUsers.push(user);
      }
    }

    return { success: true, data: allUsers };
  } catch (error) {
    console.error("Get collaborators error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch collaborators.",
    };
  }
}

/**
 * Gets all views for a project
 */
export async function getProjectViews(
  projectId: string
): Promise<ProjectResponse<View[]>> {
  try {
    const { data, error } = await db
      .from("views")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return { success: true, data: (data || []).map(toView) };
  } catch (error) {
    console.error("Get project views error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch views.",
    };
  }
}

/**
 * Checks if a user has access to a project
 */
export async function hasProjectAccess(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("owner_id", userId)
      .single();

    if (project) return true;

    const { data: collab } = await db
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    return !!collab;
  } catch {
    return false;
  }
}

/**
 * Gets the Perplexity API key for a project
 */
export async function getProjectPerplexityApiKey(
  projectId: string
): Promise<string | null> {
  try {
    const { data } = await db
      .from("projects")
      .select("perplexity_api_key")
      .eq("id", projectId)
      .single();

    if (data?.perplexity_api_key) return data.perplexity_api_key;
    return import.meta.env.VITE_PERPLEXITY_API_KEY || null;
  } catch {
    return null;
  }
}

/**
 * Updates a project
 */
export async function updateProject(
  projectId: string,
  updates: {
    name?: string;
    notes?: string | null;
    perplexitySpaceId?: string | null;
    perplexitySpaceName?: string | null;
    perplexityApiKey?: string | null;
  }
): Promise<ProjectResponse<Project>> {
  try {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.perplexitySpaceId !== undefined)
      dbUpdates.perplexity_space_id = updates.perplexitySpaceId;
    if (updates.perplexitySpaceName !== undefined)
      dbUpdates.perplexity_space_name = updates.perplexitySpaceName;
    if (updates.perplexityApiKey !== undefined)
      dbUpdates.perplexity_api_key = updates.perplexityApiKey;

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("projects")
      .update(dbUpdates)
      .eq("id", projectId)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to update project",
      };
    }

    return {
      success: true,
      data: toProject(data),
    };
  } catch (error) {
    console.error("Error updating project:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Deletes a project and all its associated data
 */
export async function deleteProject(
  projectId: string
): Promise<ProjectResponse<void>> {
  try {
    const { error } = await db.from("projects").delete().eq("id", projectId);

    if (error) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to delete project",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    };
  }
}

