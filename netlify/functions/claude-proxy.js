export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured on server" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { model, messages, system } = body;

  if (!messages || !Array.isArray(messages)) {
    return { statusCode: 400, body: JSON.stringify({ error: "messages array required" }) };
  }

  const anthropicBody = {
    model: model || "claude-sonnet-4-5",
    max_tokens: 8096,
    messages,
  };
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
      body: JSON.stringify({ error: data.error?.message || "Claude API error", details: data }),
    };
  }

  // Normalize to OpenAI-compatible format
  const content = data.content?.[0]?.text ?? "";
  const normalized = {
    id: data.id,
    model: data.model,
    choices: [{
      index: 0,
      message: { role: "assistant", content },
      finish_reason: data.stop_reason ?? "end_turn",
    }],
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      completion_tokens: data.usage?.output_tokens ?? 0,
      total_tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalized),
  };
}
