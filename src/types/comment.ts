export interface Comment {
  id: string;
  issueId: string;
  parentId: string | null;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithAuthor extends Comment {
  author?: {
    id: string;
    email: string;
    walletAddress: string;
  };
}
