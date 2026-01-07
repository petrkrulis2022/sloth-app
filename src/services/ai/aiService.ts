import Perplexity from "@perplexity-ai/perplexity_ai";
import { db } from "@/db";
import type {
  AIContextType,
  AIModel,
  AIMessage,
  AIConversation,
  ChatMessage,
  ChatResponse,
} from "@/types";
import { AI_SYSTEM_PROMPTS, AI_MODEL_CONFIG } from "@/types/ai";
import { getDecryptedApiKey } from "@/services/perplexity";

export type AIError =
  | "CONTEXT_NOT_FOUND"
  | "CONVERSATION_NOT_FOUND"
  | "API_ERROR"
  | "RATE_LIMIT"
  | "INVALID_MESSAGE"
  | "NO_API_KEY"
  | "UNKNOWN_ERROR";

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: AIError;
  message?: string;
}

const perplexityClients: Map<string, Perplexity> = new Map();

async function getPerplexityClientForUser(
  userId: string
): Promise<Perplexity | null> {
  try {
    // Skip database query - just use environment variable
    // (Database column doesn't exist yet, causing 400 errors)
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

    if (!apiKey) {
      return null;
    }

    // Create and return a new client with the API key
    return new Perplexity({ apiKey });
  } catch (error) {
    console.error("Error getting Perplexity client for user:", error);
    return null;
  }
}

async function getPerplexityClientForProject(
  projectId: string
): Promise<Perplexity | null> {
  if (perplexityClients.has(projectId)) {
    return perplexityClients.get(projectId)!;
  }

  const { data: project } = await db
    .from("projects")
    .select("perplexity_api_key")
    .eq("id", projectId)
    .single();

  const apiKey =
    project?.perplexity_api_key || import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!apiKey) return null;

  const client = new Perplexity({ apiKey });
  perplexityClients.set(projectId, client);

  return client;
}

async function getProjectIdForContext(
  contextType: AIContextType,
  contextId: string
): Promise<string | null> {
  if (contextType === "view") {
    const { data: view } = await db
      .from("views")
      .select("project_id")
      .eq("id", contextId)
      .single();
    return view?.project_id || null;
  } else {
    const { data: issue } = await db
      .from("issues")
      .select("view_id")
      .eq("id", contextId)
      .single();

    if (!issue) return null;

    const { data: view } = await db
      .from("views")
      .select("project_id")
      .eq("id", issue.view_id)
      .single();

    return view?.project_id || null;
  }
}

function toAIMessage(dbMessage: {
  id: string;
  role: string;
  content: string;
  created_at: string;
}): AIMessage {
  return {
    id: dbMessage.id,
    role: dbMessage.role as AIMessage["role"],
    content: dbMessage.content,
    createdAt: new Date(dbMessage.created_at),
  };
}

function toAIConversation(dbConversation: {
  id: string;
  context_type: string;
  context_id: string;
  created_at: string;
}): AIConversation {
  return {
    id: dbConversation.id,
    contextType: dbConversation.context_type as AIContextType,
    contextId: dbConversation.context_id,
    createdAt: new Date(dbConversation.created_at),
  };
}

async function validateContext(
  contextType: AIContextType,
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

async function getOrCreateConversation(
  contextType: AIContextType,
  contextId: string
): Promise<AIConversation | null> {
  try {
    const { data: existing } = await db
      .from("ai_conversations")
      .select("*")
      .eq("context_type", contextType)
      .eq("context_id", contextId)
      .single();

    if (existing) return toAIConversation(existing);

    const { data: created, error } = await db
      .from("ai_conversations")
      .insert({ context_type: contextType, context_id: contextId })
      .select()
      .single();

    if (error || !created) return null;

    return toAIConversation(created);
  } catch {
    return null;
  }
}

export async function chat(
  messages: ChatMessage[],
  model: AIModel,
  systemPrompt: string,
  userId: string,
  projectId?: string
): Promise<AIResponse<ChatResponse>> {
  try {
    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Call Supabase Edge Function (fixes CORS issue)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/perplexity-proxy`;

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data as ChatResponse };
  } catch (error: unknown) {
    console.error("AI chat error:", error);

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("rate")
    ) {
      return {
        success: false,
        error: "RATE_LIMIT",
        message: "Please wait a moment before sending another message.",
      };
    }

    return {
      success: false,
      error: "API_ERROR",
      message: error instanceof Error ? error.message : "AI assistant is temporarily unavailable.",
    };
  }
}

// Conversation history is now managed in component state, not database

// Messages are now managed in component state, not saved to database

export async function sendMessage(
  contextType: AIContextType,
  contextId: string,
  userMessage: string,
  userId: string,
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse<{ userMessage: string; aiResponse: string }>> {
  if (!userMessage || userMessage.trim().length === 0) {
    return {
      success: false,
      error: "INVALID_MESSAGE",
      message: "Message content is required.",
    };
  }

  try {
    // Check if API key is available in environment
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "NO_API_KEY",
        message: "Please configure your Perplexity API key in .env file.",
      };
    }

    const projectId = await getProjectIdForContext(contextType, contextId);

    const model =
      contextType === "view" ? AI_MODEL_CONFIG.view : AI_MODEL_CONFIG.issue;
    const systemPrompt =
      contextType === "view" ? AI_SYSTEM_PROMPTS.view : AI_SYSTEM_PROMPTS.issue;

    // Add current message to history for API call
    const chatMessages: ChatMessage[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const aiResult = await chat(
      chatMessages,
      model,
      systemPrompt,
      userId,
      projectId || undefined
    );

    if (!aiResult.success || !aiResult.data) {
      return {
        success: false,
        error: aiResult.error || "API_ERROR",
        message: aiResult.message || "Failed to get AI response.",
      };
    }

    const aiContent =
      aiResult.data.choices[0]?.message?.content || "No response from AI.";

    return {
      success: true,
      data: {
        userMessage: userMessage.trim(),
        aiResponse: aiContent,
      },
    };
  } catch (error) {
    console.error("Send message error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to send message.",
    };
  }
}

// Conversation clearing is now handled in component state

export { AI_SYSTEM_PROMPTS, AI_MODEL_CONFIG };
