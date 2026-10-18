/**
 * Perplexity Space connection for a project
 */
export interface PerplexityConnection {
  spaceId: string | null;
  spaceName: string | null;
  apiKey: string | null;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  notes: string | null;
  // Perplexity Space connection
  perplexitySpaceId: string | null;
  perplexitySpaceName: string | null;
  perplexityApiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat session configuration for a view
 */
export interface ChatSession {
  chatSessionId: string | null;
  chatSessionName: string | null;
  aiModel: string;
  systemPrompt: string | null;
}

export interface View {
  id: string;
  projectId: string;
  name: string;
  tag: string;
  icon: string | null;
  position: number;
  // Chat session configuration
  chatSessionId: string | null;
  chatSessionName: string | null;
  aiModel: string;
  systemPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IssueStatus = "not-started" | "in-progress" | "done";

export interface Issue {
  id: string;
  /** Set when this issue belongs to a View; null for a project-level task. */
  viewId: string | null;
  /** Set when this issue is a project-level task created directly under a Project. */
  projectId: string | null;
  parentId: string | null;
  name: string;
  issueId: string | null;
  description: string | null;
  developmentNotes: string | null;
  status: IssueStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  context?: "global" | "dashboard" | "project" | "view" | "issue";
}
