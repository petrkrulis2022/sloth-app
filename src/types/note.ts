export interface Note {
  id: string;
  projectId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteWithAuthor extends Note {
  authorName: string;
  authorEmail: string;
}
