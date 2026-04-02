import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { messages, model, apiKey } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const modelStr = typeof model === "string" ? model.toLowerCase() : "";
    const isGptModel = modelStr.startsWith("gpt-");
    const isClaudeModel = modelStr.startsWith("claude-");

    let response: Response;

    if (isClaudeModel) {
      // Anthropic Claude route
      const anthropicApiKey = apiKey || Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Separate system message from conversation messages (Anthropic format)
      const systemMessage = messages.find((m: { role: string }) =>
        m.role === "system"
      );
      const conversationMessages = messages.filter((m: { role: string }) =>
        m.role !== "system"
      );

      const anthropicBody: Record<string, unknown> = {
        model: model || "claude-opus-4-5",
        max_tokens: 8096,
        messages: conversationMessages,
      };
      if (systemMessage) {
        anthropicBody.system = systemMessage.content;
      }

      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(anthropicBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            error: "Claude API error",
            details: errorText,
            status: response.status,
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Transform Anthropic response to OpenAI-compatible format
      const anthropicData = await response.json();
      const content = anthropicData.content?.[0]?.text ?? "";
      const normalized = {
        id: anthropicData.id,
        model: anthropicData.model,
        choices: [{
          index: 0,
          message: { role: "assistant", content },
          finish_reason: anthropicData.stop_reason ?? "end_turn",
        }],
        usage: {
          prompt_tokens: anthropicData.usage?.input_tokens ?? 0,
          completion_tokens: anthropicData.usage?.output_tokens ?? 0,
          total_tokens: (anthropicData.usage?.input_tokens ?? 0) +
            (anthropicData.usage?.output_tokens ?? 0),
        },
      };
      return new Response(JSON.stringify(normalized), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (isGptModel) {
      // OpenAI route
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        return new Response(
          JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({ model, messages }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            error: "OpenAI API error",
            details: errorText,
            status: response.status,
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      return new Response(
        JSON.stringify({
          error: `Unsupported model: ${model}. Use a claude- model.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
