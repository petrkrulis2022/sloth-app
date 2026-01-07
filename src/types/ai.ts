/**
 * AI-related types for Sloth.app
 * Requirements: 9.2, 9.3, 12.2, 12.3
 */

export type AIContextType = "view" | "issue";

export type AIModel = "sonar-deep-research" | "sonar-pro";

export type AIMessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  contextType: AIContextType;
  contextId: string;
  createdAt: Date;
}

export interface ChatMessage {
  role: AIMessageRole;
  content: string;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * System prompts for different AI contexts
 */
export const AI_SYSTEM_PROMPTS = {
  view: `You are a strategic product manager and planning assistant for Sloth.app, a personal project management tool. 
Your role is to help users think through high-level strategy, goals, and planning for their projects and views.
Focus on:
- Strategic thinking and goal setting
- Breaking down complex objectives into manageable pieces
- Identifying dependencies and priorities
- Suggesting best practices for project organization
- Helping with roadmap planning and milestone definition

Be concise, actionable, and supportive. Ask clarifying questions when needed.`,

  issue: `You are a technical assistant and researcher for Sloth.app, a personal project management tool.
Your role is to help users with specific technical questions, research, and implementation details for their issues and tasks.
Focus on:
- Technical problem-solving and debugging
- Code examples and implementation guidance
- Research and finding relevant resources
- Best practices and design patterns
- Quick answers to specific questions

Be precise, technical when appropriate, and provide concrete examples when helpful.`,
} as const;

/**
 * Model configuration for different contexts
 */
export const AI_MODEL_CONFIG = {
  view: "sonar-deep-research" as AIModel,
  issue: "sonar-pro" as AIModel,
} as const;
