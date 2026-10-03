import { db } from "@/db";
import type { Note, NoteContextType, NoteWithAuthor } from "@/types";

export type NoteError = "NOTE_NOT_FOUND" | "CONTEXT_NOT_FOUND" | "UNKNOWN_ERROR";

export interface NoteResponse<T> {
  success: boolean;
  data?: T;
  error?: NoteError;
  message?: string;
}

const TABLE_BY_CONTEXT: Record<NoteContextType, "project_notes" | "view_notes"> = {
  project: "project_notes",
  view: "view_notes",
};

const CONTEXT_COLUMN_BY_CONTEXT: Record<NoteContextType, "project_id" | "view_id"> = {
  project: "project_id",
  view: "view_id",
};

/**
 * Converts a database note record (from either project_notes or view_notes) to Note type
 */
function toNote(
  contextType: NoteContextType,
  contextId: string,
  dbNote: {
    id: string;
    content: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }
): Note {
  return {
    id: dbNote.id,
    contextType,
    contextId,
    content: dbNote.content,
    createdBy: dbNote.created_by,
    createdAt: new Date(dbNote.created_at),
    updatedAt: new Date(dbNote.updated_at),
  };
}

/**
 * Gets all notes for a project or view
 */
export async function getNotes(
  contextType: NoteContextType,
  contextId: string
): Promise<NoteResponse<NoteWithAuthor[]>> {
  try {
    const table = TABLE_BY_CONTEXT[contextType];
    const column = CONTEXT_COLUMN_BY_CONTEXT[contextType];

    const { data: notes, error } = await db
      .from(table)
      .select("*")
      .eq(column, contextId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Fetch author information separately
    const authorIds = [...new Set((notes || []).map((n) => n.created_by))];
    let authors: Record<string, { id: string; email: string }> = {};

    if (authorIds.length > 0) {
      const { data: users } = await db
        .from("users")
        .select("id, email")
        .in("id", authorIds);

      authors = (users || []).reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as typeof authors);
    }

    const notesWithAuthor: NoteWithAuthor[] = (notes || []).map((note) => ({
      ...toNote(contextType, contextId, note),
      authorName: authors[note.created_by]?.email?.split("@")[0] || "Unknown",
      authorEmail: authors[note.created_by]?.email || "",
    }));

    return { success: true, data: notesWithAuthor };
  } catch (error) {
    console.error("Get notes error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch notes.",
    };
  }
}

/**
 * Adds a new note to a project or view
 */
export async function addNote(
  contextType: NoteContextType,
  contextId: string,
  content: string,
  createdBy: string
): Promise<NoteResponse<Note>> {
  if (!content.trim()) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Note content is required.",
    };
  }

  try {
    const { data, error } =
      contextType === "project"
        ? await db
            .from("project_notes")
            .insert({
              project_id: contextId,
              content: content.trim(),
              created_by: createdBy,
            })
            .select()
            .single()
        : await db
            .from("view_notes")
            .insert({
              view_id: contextId,
              content: content.trim(),
              created_by: createdBy,
            })
            .select()
            .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to add note.",
      };
    }

    return { success: true, data: toNote(contextType, contextId, data) };
  } catch (error) {
    console.error("Add note error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to add note.",
    };
  }
}

/**
 * Updates the content of an existing note
 */
export async function updateNote(
  contextType: NoteContextType,
  noteId: string,
  content: string
): Promise<NoteResponse<void>> {
  if (!content.trim()) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Note content is required.",
    };
  }

  try {
    const table = TABLE_BY_CONTEXT[contextType];
    const { error } = await db
      .from(table)
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", noteId);

    if (error) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to update note.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Update note error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to update note.",
    };
  }
}

/**
 * Deletes a note
 */
export async function deleteNote(
  contextType: NoteContextType,
  noteId: string
): Promise<NoteResponse<void>> {
  try {
    const table = TABLE_BY_CONTEXT[contextType];
    const { error } = await db.from(table).delete().eq("id", noteId);

    if (error) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to delete note.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete note error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to delete note.",
    };
  }
}
