import { db } from "@/db";
import type {
  AIContextType,
  AIConversation,
  AIMessage,
  AIModel,
  ChatMessage,
  ChatResponse,
} from "@/types";
import {
  AI_EFFORT,
  AI_MODEL_CONFIG,
  AI_SYSTEM_PROMPTS,
  supportsAdaptiveThinking,
} from "@/types/ai";
import { getDocuments, getDownloadUrl } from "@/services/document";
import { getLinks } from "@/services/link";

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

async function getProjectIdForContext(
  contextType: AIContextType,
  contextId: string,
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
  contextId: string,
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
  contextId: string,
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

type AIContentBlock =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "url"; url: string }; title?: string }
  | { type: "image"; source: { type: "url"; url: string } };

export interface ChatAttachments {
  blocks: AIContentBlock[];
  contextText: string;
}

const READABLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Collects saved documents and links for a context so the assistant can use
 * them. PDFs and images are attached as content blocks via short-lived signed
 * URLs (the Anthropic API fetches them server-side, so the request body stays
 * small); links are listed in context so the web_fetch tool can read them.
 * Best effort — a failure just means the chat proceeds without extra context.
 */
export async function buildContextAttachments(
  contextType: AIContextType,
  contextId: string,
): Promise<ChatAttachments | null> {
  try {
    const [docsResult, linksResult] = await Promise.all([
      getDocuments(contextType, contextId),
      getLinks(contextType, contextId),
    ]);

    const blocks: AIContentBlock[] = [];
    const attached: string[] = [];
    const unreadable: string[] = [];

    for (const doc of docsResult.data ?? []) {
      const isPdf = doc.fileType === "application/pdf";
      const isImage = READABLE_IMAGE_TYPES.includes(doc.fileType);
      if (!isPdf && !isImage) {
        // Office docs / SVG can't be read natively by the API
        unreadable.push(doc.fileName);
        continue;
      }

      const urlResult = await getDownloadUrl(doc.id);
      if (!urlResult.success || !urlResult.data) continue;

      if (isPdf) {
        blocks.push({
          type: "document",
          source: { type: "url", url: urlResult.data },
          title: doc.fileName,
        });
      } else {
        blocks.push({
          type: "image",
          source: { type: "url", url: urlResult.data },
        });
      }
      attached.push(doc.fileName);
    }

    const lines: string[] = [];
    if (attached.length > 0) {
      lines.push(
        `Documents saved in this workspace are attached above: ${
          attached.join(", ")
        }.`,
      );
    }
    if (unreadable.length > 0) {
      lines.push(
        `These saved documents exist but you cannot read their format directly: ${
          unreadable.join(", ")
        }. If their content is needed, suggest re-uploading them as PDF.`,
      );
    }
    const links = linksResult.data ?? [];
    if (links.length > 0) {
      lines.push(
        "Links saved in this workspace (read them with web_fetch when relevant):",
      );
      for (const link of links) {
        lines.push(
          `- ${link.url}${link.description ? ` — ${link.description}` : ""}`,
        );
      }
    }

    if (blocks.length === 0 && lines.length === 0) return null;
    return { blocks, contextText: lines.join("\n") };
  } catch (error) {
    console.warn("Failed to collect chat context attachments:", error);
    return null;
  }
}

export async function chat(
  messages: ChatMessage[],
  model: AIModel,
  systemPrompt: string,
  userId: string,
  projectId?: string,
  attachments?: ChatAttachments | null,
): Promise<AIResponse<ChatResponse>> {
  try {
    const resolvedModel = model || "claude-opus-4-8";
    // Adaptive thinking, effort, and the 20260209 web tools are only accepted
    // by Opus 4.6+ / Sonnet 4.6+; older models reject them with a 400.
    const isModernModel = supportsAdaptiveThinking(resolvedModel);
    const reasoningParams = isModernModel
      ? {
        thinking: { type: "adaptive" },
        output_config: { effort: AI_EFFORT },
      }
      : {};

    // Server-side tools — Anthropic executes them, nothing runs client-side.
    const tools = isModernModel
      ? [
        { type: "web_search_20260209", name: "web_search", max_uses: 3 },
        {
          type: "web_fetch_20260209",
          name: "web_fetch",
          max_uses: 5,
          max_content_tokens: 25000,
        },
      ]
      : undefined;

    const system = tools
      ? `${systemPrompt}\n\nYou can access the web: use web_fetch to read any URL the user shares or that appears in the workspace context, and web_search when current information would improve the answer. Do not claim you cannot browse the web.`
      : systemPrompt;

    type ApiMessage = {
      role: "user" | "assistant";
      content: string | unknown[];
    };
    const apiMessages: ApiMessage[] = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Attach saved documents + workspace context to the latest user message
    const last = apiMessages[apiMessages.length - 1];
    if (
      attachments && last?.role === "user" && typeof last.content === "string"
    ) {
      last.content = [
        ...attachments.blocks,
        ...(attachments.contextText
          ? [{
            type: "text",
            text:
              `<workspace_context>\n${attachments.contextText}\n</workspace_context>`,
          }]
          : []),
        { type: "text", text: last.content },
      ];
    }

    // Determine if we're in development or production
    const isDev = import.meta.env.DEV ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const callClaude = async (
      requestMessages: ApiMessage[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> => {
      let response: Response;

      if (isDev) {
        // In development, call Claude directly (API key is in .env)
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error("VITE_ANTHROPIC_API_KEY not configured in .env");
        }

        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: resolvedModel,
            max_tokens: 16000,
            ...reasoningParams,
            ...(tools ? { tools } : {}),
            messages: requestMessages,
            system,
          }),
        });
      } else {
        // In production, call via Netlify serverless function proxy
        // (the proxy adds the same web tools server-side)
        response = await fetch("/.netlify/functions/claude-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: resolvedModel,
            effort: AI_EFFORT,
            messages: requestMessages,
            system,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      return await response.json();
    };

    let requestMessages = apiMessages;
    let data = await callClaude(requestMessages);

    // Server-side tools pause after their internal iteration limit
    // (stop_reason "pause_turn"); re-sending with the assistant turn appended
    // resumes where the server left off.
    for (let i = 0; i < 5 && data.stop_reason === "pause_turn"; i++) {
      requestMessages = [
        ...requestMessages,
        { role: "assistant", content: data.content },
      ];
      data = await callClaude(requestMessages);
    }

    // Normalize the Anthropic response. Text can be split across several
    // blocks interleaved with thinking / server-tool blocks — join them all.
    const text =
      ((data.content ?? []) as Array<{ type: string; text?: string }>)
        .filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("\n\n");

    const normalized: ChatResponse = {
      id: data.id,
      model: data.model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: data.stop_reason ?? "end_turn",
        },
      ],
      usage: {
        prompt_tokens: data.usage?.input_tokens ?? 0,
        completion_tokens: data.usage?.output_tokens ?? 0,
        total_tokens: (data.usage?.input_tokens ?? 0) +
          (data.usage?.output_tokens ?? 0),
      },
    };

    return { success: true, data: normalized };
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
      message: error instanceof Error
        ? error.message
        : "AI assistant is temporarily unavailable.",
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
  conversationHistory: ChatMessage[] = [],
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
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "NO_API_KEY",
        message: "Please configure your VITE_ANTHROPIC_API_KEY in .env file.",
      };
    }

    const projectId = await getProjectIdForContext(contextType, contextId);

    const model = contextType === "view"
      ? AI_MODEL_CONFIG.view
      : AI_MODEL_CONFIG.issue;
    const systemPrompt = contextType === "view"
      ? AI_SYSTEM_PROMPTS.view
      : AI_SYSTEM_PROMPTS.issue;

    // Add current message to history for API call
    const chatMessages: ChatMessage[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // Saved documents (PDFs/images) and links for this view/issue/project
    const attachments = await buildContextAttachments(contextType, contextId);

    const aiResult = await chat(
      chatMessages,
      model,
      systemPrompt,
      userId,
      projectId || undefined,
      attachments,
    );

    if (!aiResult.success || !aiResult.data) {
      return {
        success: false,
        error: aiResult.error || "API_ERROR",
        message: aiResult.message || "Failed to get AI response.",
      };
    }

    const aiContent = aiResult.data.choices[0]?.message?.content ||
      "No response from AI.";

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

export { AI_MODEL_CONFIG, AI_SYSTEM_PROMPTS };
