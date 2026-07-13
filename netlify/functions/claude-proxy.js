export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "ANTHROPIC_API_KEY not configured on server",
      }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { model, messages, system, effort } = body;

  if (!messages || !Array.isArray(messages)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "messages array required" }),
    };
  }

  const resolvedModel = model || "claude-opus-4-8";

  // Adaptive thinking + output_config.effort are only accepted by
  // Opus 4.6+ / Sonnet 4.6+; older models reject them with a 400.
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
    messages,
  };
  if (supportsAdaptiveThinking) {
    anthropicBody.thinking = { type: "adaptive" };
    anthropicBody.output_config = { effort: effort || "high" };
    // Server-side web tools (executed on Anthropic's infrastructure) so the
    // assistant can read saved/shared links. Only supported on these models.
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
  if (system) {
    anthropicBody.system = system;
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

  const data = await anthropicRes.json();

  if (!anthropicRes.ok) {
    return {
      statusCode: anthropicRes.status,
      body: JSON.stringify({
        error: data.error?.message || "Claude API error",
        details: data,
      }),
    };
  }

  // Return the raw Anthropic response — the client normalizes it and
  // handles the pause_turn continuation loop for server-side web tools.
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
