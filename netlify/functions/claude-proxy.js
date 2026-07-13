// Streaming proxy for the Anthropic API (Netlify Functions v2).
//
// The response is streamed straight through as SSE. Synchronous Netlify
// functions are killed after ~10s, which heavy requests (PDF documents,
// web_fetch tool calls, high reasoning effort) regularly exceed — streamed
// responses only need to start quickly, then may run for minutes. The
// client (aiService.ts) reassembles the SSE events into a full message.
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured on server" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { model, messages, system, effort } = body;

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages array required" }, {
      status: 400,
    });
  }

  const resolvedModel = model || "claude-opus-4-8";

  // Adaptive thinking, effort, and the 20260209 web tools are only accepted
  // by Opus 4.6+ / Sonnet 4.6+; older models reject them with a 400.
  const supportsAdaptiveThinking = [
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-5",
    "claude-sonnet-4-6",
  ].some((id) => resolvedModel.startsWith(id));

  const anthropicBody = {
    model: resolvedModel,
    max_tokens: 16000,
    stream: true,
    messages,
  };
  if (system) {
    anthropicBody.system = system;
  }
  if (supportsAdaptiveThinking) {
    anthropicBody.thinking = { type: "adaptive" };
    anthropicBody.output_config = { effort: effort || "high" };
    // Server-side web tools (executed on Anthropic's infrastructure) so the
    // assistant can read saved/shared links.
    anthropicBody.tools = [
      { type: "web_search_20260209", name: "web_search", max_uses: 3 },
      {
        type: "web_fetch_20260209",
        name: "web_fetch",
        max_uses: 5,
        max_content_tokens: 25000,
      },
    ];
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(anthropicBody),
  });

  if (!anthropicRes.ok) {
    const data = await anthropicRes.json().catch(() => ({}));
    return Response.json(
      { error: data.error?.message || "Claude API error", details: data },
      { status: anthropicRes.status },
    );
  }

  // Pipe the SSE stream straight through to the browser
  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
};
