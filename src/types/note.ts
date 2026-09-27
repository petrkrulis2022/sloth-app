/**
 * Context type for notes - can be attached to projects or views
 */
export type NoteContextType = "project" | "view";

export interface Note {
  id: string;
  contextType: NoteContextType;
  contextId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteWithAuthor extends Note {
  authorName: string;
  authorEmail: string;
}
