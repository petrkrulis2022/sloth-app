/**
 * Link type definitions for Sloth.app
 * Requirements: 8.4, 13.3, 13.4
 */

/**
 * Context type for links - can be attached to projects, views or issues
 */
export type LinkContextType = "project" | "view" | "issue";

/**
 * Link entity representing an external link
 */
export interface Link {
  id: string;
  contextType: LinkContextType;
  contextId: string;
  url: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
}

/**
 * Link with creator information
 */
export interface LinkWithCreator extends Link {
  creator?: {
    id: string;
    email: string;
    walletAddress: string;
  };
}

/**
 * Input for adding a new link
 */
export interface AddLinkInput {
  url: string;
  description?: string;
  contextType: LinkContextType;
  contextId: string;
  createdBy: string;
}
