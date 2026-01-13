import { db } from "@/db";
import type { Note, NoteWithAuthor } from "@/types";

export type NoteError = "NOTE_NOT_FOUND" | "PROJECT_NOT_FOUND" | "UNKNOWN_ERROR";

export interface NoteResponse<T> {
  success: boolean;
  data?: T;
  error?: NoteError;
  message?: string;
}

/**
 * Converts database note record to Note type
 */
function toNote(dbNote: {
  id: string;
  project_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}): Note {
  return {
    id: dbNote.id,
    projectId: dbNote.project_id,
    content: dbNote.content,
    createdBy: dbNote.created_by,
    createdAt: new Date(dbNote.created_at),
    updatedAt: new Date(dbNote.updated_at),
  };
}

/**
 * Gets all notes for a project
 */
export async function getNotes(projectId: string): Promise<NoteResponse<NoteWithAuthor[]>> {
  try {
    const { data: notes, error } = await db
      .from("project_notes")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Fetch author information separately
    const authorIds = [...new Set((notes || []).map((n) => n.created_by))];
    let authors: Record<string, { id: string; name: string; email: string }> = {};

    if (authorIds.length > 0) {
      const { data: users } = await db
        .from("users")
        .select("id, name, email")
        .in("id", authorIds);

      authors = (users || []).reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as typeof authors);
    }

    const notesWithAuthor: NoteWithAuthor[] = (notes || []).map((note) => ({
      ...toNote(note),
      authorName: authors[note.created_by]?.name || "Unknown",
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
 * Adds a new note to a project
 */
export async function addNote(
  projectId: string,
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
    const { data, error } = await db
      .from("project_notes")
      .insert({
        project_id: projectId,
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

    return { success: true, data: toNote(data) };
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
 * Deletes a note
 */
export async function deleteNote(noteId: string): Promise<NoteResponse<void>> {
  try {
    const { error } = await db.from("project_notes").delete().eq("id", noteId);

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
