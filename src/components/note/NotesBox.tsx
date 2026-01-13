import { useState, useEffect, useCallback } from "react";
import { getNotes, addNote, deleteNote } from "@/services/note";
import { getCurrentSession } from "@/services/auth";
import type { NoteWithAuthor } from "@/types";

export interface NotesBoxProps {
  projectId: string;
}

/**
 * Displays project notes in chronological order with author information
 * Similar to comments but for project-level notes
 */
export function NotesBox({ projectId }: NotesBoxProps) {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getNotes(projectId);
    if (result.success && result.data) {
      setNotes(result.data);
    } else {
      setError(result.message || "Failed to load notes.");
    }

    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Handle adding a new note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.trim()) return;

    const session = getCurrentSession();
    if (!session) {
      setError("You must be logged in to add notes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addNote(projectId, newNote, session.userId);

    if (result.success) {
      setNewNote("");
      await fetchNotes();
    } else {
      setError(result.message || "Failed to add note.");
    }

    setIsSubmitting(false);
  };

  // Handle deleting a note
  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    const result = await deleteNote(noteId);
    if (result.success) {
      await fetchNotes();
    } else {
      setError(result.message || "Failed to delete note.");
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-surface border border-default rounded-lg p-4">
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
          Project Notes
        </h3>
        <div className="text-sm text-muted animate-pulse">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-default rounded-lg p-4">
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
        Project Notes
        {notes.length > 0 && (
          <span className="text-xs text-muted">({notes.length})</span>
        )}
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-md">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">
            No notes yet. Add your first note below.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-app rounded-lg p-3 group relative">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs font-medium text-white">
                    {note.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {note.authorName}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all p-1"
                  title="Delete note"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-secondary whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add note form */}
      <form onSubmit={handleAddNote} className="space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full px-3 py-2 bg-background border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newNote.trim() || isSubmitting}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {isSubmitting ? "Posting..." : "Post Note"}
          </button>
        </div>
      </form>
    </div>
  );
}
