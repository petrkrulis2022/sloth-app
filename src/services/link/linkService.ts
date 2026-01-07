import { db } from "@/db";
import type { Link, LinkWithCreator, LinkContextType } from "@/types";

export type LinkError =
  | "LINK_NOT_FOUND"
  | "CONTEXT_NOT_FOUND"
  | "INVALID_URL"
  | "UNKNOWN_ERROR";

export interface LinkResponse<T> {
  success: boolean;
  data?: T;
  error?: LinkError;
  message?: string;
}

function toLink(dbLink: {
  id: string;
  context_type: string;
  context_id: string;
  url: string;
  description: string | null;
  created_by: string;
  created_at: string;
}): Link {
  return {
    id: dbLink.id,
    contextType: dbLink.context_type as LinkContextType,
    contextId: dbLink.context_id,
    url: dbLink.url,
    description: dbLink.description,
    createdBy: dbLink.created_by,
    createdAt: new Date(dbLink.created_at),
  };
}

export function validateUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false;
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
}

async function validateContext(
  contextType: LinkContextType,
  contextId: string
): Promise<boolean> {
  const table = contextType === "view" ? "views" : "issues";
  const { data } = await db
    .from(table)
    .select("id")
    .eq("id", contextId)
    .single();
  return !!data;
}

export async function addLink(
  url: string,
  description: string | undefined,
  contextType: LinkContextType,
  contextId: string,
  createdBy: string
): Promise<LinkResponse<Link>> {
  if (!validateUrl(url)) {
    return {
      success: false,
      error: "INVALID_URL",
      message: "Please enter a valid URL.",
    };
  }

  try {
    const contextExists = await validateContext(contextType, contextId);
    if (!contextExists) {
      return {
        success: false,
        error: "CONTEXT_NOT_FOUND",
        message: `${contextType === "view" ? "View" : "Issue"} not found.`,
      };
    }

    const { data, error } = await db
      .from("links")
      .insert({
        context_type: contextType,
        context_id: contextId,
        url: url.trim(),
        description: description?.trim() || null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create link.",
      };
    }

    return { success: true, data: toLink(data) };
  } catch (error) {
    console.error("Add link error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to add link.",
    };
  }
}

export async function getLinks(
  contextType: LinkContextType,
  contextId: string
): Promise<LinkResponse<LinkWithCreator[]>> {
  try {
    const contextExists = await validateContext(contextType, contextId);
    if (!contextExists) {
      return {
        success: false,
        error: "CONTEXT_NOT_FOUND",
        message: `${contextType === "view" ? "View" : "Issue"} not found.`,
      };
    }

    const { data: links, error } = await db
      .from("links")
      .select("*")
      .eq("context_type", contextType)
      .eq("context_id", contextId);

    if (error) throw error;

    const creatorIds = [...new Set((links || []).map((l) => l.created_by))];
    let creators: Record<
      string,
      { id: string; email: string; wallet_address: string }
    > = {};

    if (creatorIds.length > 0) {
      const { data: users } = await db
        .from("users")
        .select("id, email, wallet_address")
        .in("id", creatorIds);

      creators = (users || []).reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as typeof creators);
    }

    const linksWithCreator: LinkWithCreator[] = (links || []).map((l) => ({
      ...toLink(l),
      creator: creators[l.created_by]
        ? {
            id: creators[l.created_by].id,
            email: creators[l.created_by].email,
            walletAddress: creators[l.created_by].wallet_address,
          }
        : undefined,
    }));

    return { success: true, data: linksWithCreator };
  } catch (error) {
    console.error("Get links error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch links.",
    };
  }
}

export async function deleteLink(linkId: string): Promise<LinkResponse<void>> {
  try {
    const { data: existingLink } = await db
      .from("links")
      .select("id")
      .eq("id", linkId)
      .single();

    if (!existingLink) {
      return {
        success: false,
        error: "LINK_NOT_FOUND",
        message: "Link not found.",
      };
    }

    const { error } = await db.from("links").delete().eq("id", linkId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Delete link error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to delete link.",
    };
  }
}

export async function getLink(linkId: string): Promise<LinkResponse<Link>> {
  try {
    const { data, error } = await db
      .from("links")
      .select("*")
      .eq("id", linkId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "LINK_NOT_FOUND",
        message: "Link not found.",
      };
    }

    return { success: true, data: toLink(data) };
  } catch (error) {
    console.error("Get link error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch link.",
    };
  }
}
