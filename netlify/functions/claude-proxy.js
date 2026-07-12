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

  // Normalize to OpenAI-compatible format. With adaptive thinking the first
  // block can be a thinking block — pick the text block explicitly.
  const content =
    data.content?.find((block) => block.type === "text")?.text ?? "";
  const normalized = {
    id: data.id,
    model: data.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: data.stop_reason ?? "end_turn",
      },
    ],
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      completion_tokens: data.usage?.output_tokens ?? 0,
      total_tokens:
        (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalized),
  };
}
